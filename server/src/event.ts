/**
 * This file contains a specification for a general event that
 * should be used for adding event handlers to the app.
 *
 * This might seem like a lot of boilerplate; the idea behind separation
 * is that we get a clear instance that works in deterministic way based on
 * the input. You can think of an event as code executing in a very limited
 * environemnt. This file outlines the functions available in it.
 */

import { Probot } from 'probot'
import { ProbotWebhooks } from 'probot/lib/types'

import { Data } from './database'

// MARK: - Spec

// export type Event<E extends WebhookEvents> = (
//   event: E | E[],
//   callback: HandlerFunction<E, U>,
// ) => void

export type Handler = (on: ProbotWebhooks['on'], sources: Sources) => void

/**
 * Sources outline third-party functions available to the event code
 * in the execution environment.
 */
export type Sources = {
  data: IData
}

export interface IData {
  /**
   * Returns the installation associated with a given owner.
   */
  plan: Data['plan']

  /**
   * Returns information about a configuration for a given repository.
   */
  config: Data['config']

  /**
   * Updates the last installation for a given owner.
   */
  install: Data['install']
}

// MARK: - Methods

type BindParams = {
  handlers: Handler[]
  probot: Probot
  sources: Sources
}

/**
 * Binds handlers to sources.
 */
export function bind(params: BindParams) {}
