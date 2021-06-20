/**
 * This file contains the datasource that connects to the database.
 */

import { PrismaClient } from '@prisma/client'
import * as prisma from '@prisma/client'

import * as t from 'luxon'

import * as c from './config'
import { Maybe } from './data/maybe'

export class Data {
  // MARK: - State

  private prisma: PrismaClient

  // MARK: - Constructor

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // MARK: - Methods

  /**
   * Returns the configuration of a particular installation.
   */
  async config(owner: string, repo: string): Promise<Maybe<c.LSCRepository>> {
    const [config] = await this.prisma.repositoryConfiguration.findMany({
      where: {
        configuration: { active: { owner: owner } },
        repository: { in: [repo, '*'] },
      },
      orderBy: {
        repository: 'asc',
      },
      include: {
        labels: true,
      },
    })

    if (config === undefined) return null

    let configuration: c.LSCRepository = {
      config: {
        removeUnconfiguredLabels: config.removeUnconfiguredLabels,
      },
      labels: new Map(),
    }

    for (const label of config.labels) {
      configuration.labels.set(label.name, {
        color: label.color,
        description: label.description,
        alias: label.alias,
        siblings: label.siblings,
      })
    }

    return configuration
  }

  /**
   * Returns the user plan.
   */
  async plan(owner: string): Promise<prisma.Plan> {
    const now = t.DateTime.now()

    const installation = await this.prisma.installation.findUnique({
      where: { owner: owner },
    })

    /**
     * Check that we have an installation and that plan is still valid.
     */
    if (installation === null) return 'FREE'
    if (t.DateTime.fromJSDate(installation.periodEndsAt) < now) return 'FREE'

    return installation.plan
  }

  async install(): Promise<void> {}
}
