import cuid from 'cuid'
import { DateTime } from 'luxon'
import plimit from 'p-limit'

import { DatabaseSource } from '../lib/dbsource'
import { Installation } from '../lib/types'

type Key = { account: string }

type Value = {
  ttl: DateTime
} & Installation

/**
 * Lets you check information about the installation for a given user.
 */
export class InstallationsSource extends DatabaseSource<Key, Value> {
  constructor() {
    super(5, 60 * 1000)
  }

  async fetch(key: Key): Promise<Value | null> {
    const installation = await this.prisma().installation.findUnique({
      where: { account: key.account },
    })

    if (installation == null) {
      return null
    }

    return {
      ...installation,
      periodEndsAt: DateTime.fromJSDate(installation.periodEndsAt),
      ttl: DateTime.now().plus({ days: 1 }),
    }
  }

  identify(key: Key): string {
    return key.account
  }

  // Utility Methods

  /**
   * Creates a new installation if it doesn't exist yet with provided data or
   * activates an existing one.
   */
  public activate(data: Pick<Installation, 'account'> & Partial<Pick<Installation, 'email' | 'ghInstallationId'>>) {
    const id = cuid()

    this.invalidate({ account: data.account })
    this.enqueue(async () => {
      await this.prisma().installation.upsert({
        where: { account: data.account },
        create: {
          id,
          account: data.account,
          ghInstallationId: data.ghInstallationId,
          email: data.email,
          plan: 'FREE',
          periodEndsAt: DateTime.now().plus({ months: 6 }).toJSDate(),
          activated: true,
        },
        update: {
          ghInstallationId: data.ghInstallationId,
          activated: true,
        },
      })
    })
  }

  /**
   * Upgrades plan to pro.
   *
   * @parameter cadence - Number of months covered by the payment.
   *
   * NOTE: This function assumes that the user has already created
   * account. If they haven't, it will fail.
   */
  public async upgrade(data: {
    account: string
    email?: string | null
    periodEndsAt: DateTime
  }): Promise<Installation | null> {
    const installation = await this.get({ account: data.account })
    if (!installation) {
      return null
    }

    const updatedInstallation = {
      ...installation,
      plan: 'PAID' as const,
      periodEndsAt: data.periodEndsAt,
      ttl: DateTime.now().plus({ days: 1 }),
    }

    this.enqueue(async () => {
      await this.prisma().installation.upsert({
        where: { account: data.account },
        create: {
          plan: 'PAID' as const,
          account: data.account,
          periodEndsAt: updatedInstallation.periodEndsAt.toJSDate(),
          email: data.email,
          activated: false,
        },
        update: {
          plan: 'PAID' as const,
          periodEndsAt: updatedInstallation.periodEndsAt.toJSDate(),
          email: data.email,
        },
      })
    })
    this.set({ account: data.account }, updatedInstallation)

    return updatedInstallation
  }

  /**
   * Traverses the list of installations and registers them in the database if they don't exist yet.
   */
  public async migrate(installations: Pick<Installation, 'account' | 'email'>[]): Promise<void> {
    const climit = plimit(5)
    const time = DateTime.now()

    const tasks = installations.map((installation) =>
      climit(async () => {
        this.prisma().installation.upsert({
          where: { account: installation.account },
          create: {
            account: installation.account,
            email: installation.email,
            plan: 'FREE',
            periodEndsAt: time.plus({ years: 1 }).toJSDate(),
            activated: true,
          },
          update: {
            activated: true,
          },
        })
      }),
    )

    await Promise.all(tasks)
  }
}
