import cuid from 'cuid'
import { DateTime } from 'luxon'
import plimit from 'p-limit'

import { Source } from '../lib/source'
import { Installation } from '../lib/types'

type Key = { account: string }

type Value = {
  ttl: DateTime
} & Installation

/**
 * Lets you check information about the installation for a given user.
 */
export class InstallationsSource extends Source<Key, Value> {
  async fetch(key: Key): Promise<Value | null> {
    const installation = await this.prisma().installation.findUnique({
      where: { account: key.account },
    })

    if (installation == null) {
      return null
    }

    return { ...installation, ttl: DateTime.now().plus({ days: 1 }) }
  }

  identify(key: Key): string {
    return key.account
  }

  // Utility Methods

  /**
   * Creates a new installation or updates the existing one with given data.
   */
  public upsert(
    installation: Pick<Installation, 'account' | 'activated' | 'plan'> & {
      email?: string | null
      cadence: 'YEARLY' | 'MONTHLY'
    },
  ): Omit<Value, 'ttl'> {
    const id = cuid()

    let periodEndsAt = DateTime.now()
    switch (installation.cadence) {
      case 'MONTHLY': {
        periodEndsAt = periodEndsAt.plus({ months: 1 })
        break
      }
      case 'YEARLY': {
        periodEndsAt = periodEndsAt.plus({ years: 1 })
        break
      }
    }

    const data = {
      id,
      createdAt: DateTime.now().toJSDate(),
      account: installation.account,
      email: installation.email ?? null,
      plan: installation.plan,
      periodEndsAt: periodEndsAt.toJSDate(),
      activated: installation.activated,
    }

    this.enqueue(async () => {
      await this.prisma().installation.upsert({
        where: { account: installation.account },
        create: data,
        update: {
          activated: data.activated,
          periodEndsAt: data.periodEndsAt,
        },
      })
    })

    this.set(
      { account: installation.account },
      {
        ...data,
        ttl: DateTime.now().plus({ days: 1 }),
      },
    )

    return data
  }

  /**
   * Upgrades plan to pro.
   *
   * @parameter cadence - Number of months covered by the payment.
   *
   * NOTE: This function assumes that the user has already created
   * account. If they haven't, it will fail.
   */
  public async upgrade(data: { account: string; cadence: number }): Promise<Installation | null> {
    const installation = await this.get({ account: data.account })
    if (!installation) {
      return null
    }

    const updatedInstallation = {
      ...installation,
      plan: 'PAID' as const,
      periodEndsAt: DateTime.now().plus({ months: data.cadence }).toJSDate(),
      ttl: DateTime.now().plus({ days: 1 }),
    }

    this.enqueue(async () => {
      await this.prisma().installation.update({
        where: { account: data.account },
        data: {
          plan: 'PAID' as const,
          periodEndsAt: updatedInstallation.periodEndsAt,
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

// /**
//  * Runs the script once on the server.
//  */
// /* istanbul ignore next */
// async function migrate() {
//   winston.info('Migrating...')

//   const gh = await app.auth()

//   /* Github Installations */
//   const ghapp = await gh.apps.getAuthenticated().then((res) => res.data)

//   /* Tracked installations */
//   const lsInstallations = await prisma.installation.count({
//     where: { activated: true },
//   })
//   winston.info(`Existing installations: ${ghapp.installations_count}`)

//   /* Skip sync if all are already tracked. */
//   if (lsInstallations >= ghapp.installations_count) {
//     winston.info(`All installations in sync.`)
//     return
//   }

//   const installations = await gh.apps
//     .listInstallations({
//       page: 0,
//       per_page: 100,
//     })
//     .then((res) => res.data)

//   /* Process installations */
//   for (const installation of installations) {
//     winston.info(`Syncing with database ${installation.account.login}`)
//     const now = moment()
//     const account = installation.account.login.toLowerCase()
//     await prisma.installation.upsert({
//       where: { account },
//       create: {
//         account,
//         email: null,
//         plan: 'FREE',
//         periodEndsAt: now.clone().add(3, 'years').toDate(),
//         activated: true,
//       },
//       update: {
//         activated: true,
//       },
//     })
//   }
// }
