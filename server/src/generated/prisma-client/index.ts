// Code generated by Prisma (prisma@1.28.1). DO NOT EDIT.
// Please don't change this file manually but run `prisma generate` to update it.
// For more information, please read the docs: https://www.prisma.io/docs/prisma-client/

import { DocumentNode } from 'graphql'
import {
  makePrismaClientClass,
  BaseClientOptions,
  Model,
} from 'prisma-client-lib'
import { typeDefs } from './prisma-schema'

export type AtLeastOne<T, U = { [K in keyof T]: Pick<T, K> }> = Partial<T> &
  U[keyof U]

export interface Exists {
  label: (where?: LabelWhereInput) => Promise<boolean>
  repository: (where?: RepositoryWhereInput) => Promise<boolean>
  user: (where?: UserWhereInput) => Promise<boolean>
}

export interface Node {}

export type FragmentableArray<T> = Promise<Array<T>> & Fragmentable

export interface Fragmentable {
  $fragment<T>(fragment: string | DocumentNode): Promise<T>
}

export interface Prisma {
  $exists: Exists
  $graphql: <T = any>(
    query: string,
    variables?: { [key: string]: any },
  ) => Promise<T>

  /**
   * Queries
   */

  label: (where: LabelWhereUniqueInput) => LabelPromise
  labels: (
    args?: {
      where?: LabelWhereInput
      orderBy?: LabelOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => FragmentableArray<Label>
  labelsConnection: (
    args?: {
      where?: LabelWhereInput
      orderBy?: LabelOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => LabelConnectionPromise
  repository: (where: RepositoryWhereUniqueInput) => RepositoryPromise
  repositories: (
    args?: {
      where?: RepositoryWhereInput
      orderBy?: RepositoryOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => FragmentableArray<Repository>
  repositoriesConnection: (
    args?: {
      where?: RepositoryWhereInput
      orderBy?: RepositoryOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => RepositoryConnectionPromise
  user: (where: UserWhereUniqueInput) => UserPromise
  users: (
    args?: {
      where?: UserWhereInput
      orderBy?: UserOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => FragmentableArray<User>
  usersConnection: (
    args?: {
      where?: UserWhereInput
      orderBy?: UserOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => UserConnectionPromise
  node: (args: { id: ID_Output }) => Node

  /**
   * Mutations
   */

  createLabel: (data: LabelCreateInput) => LabelPromise
  updateLabel: (
    args: { data: LabelUpdateInput; where: LabelWhereUniqueInput },
  ) => LabelPromise
  updateManyLabels: (
    args: { data: LabelUpdateManyMutationInput; where?: LabelWhereInput },
  ) => BatchPayloadPromise
  upsertLabel: (
    args: {
      where: LabelWhereUniqueInput
      create: LabelCreateInput
      update: LabelUpdateInput
    },
  ) => LabelPromise
  deleteLabel: (where: LabelWhereUniqueInput) => LabelPromise
  deleteManyLabels: (where?: LabelWhereInput) => BatchPayloadPromise
  createRepository: (data: RepositoryCreateInput) => RepositoryPromise
  updateRepository: (
    args: { data: RepositoryUpdateInput; where: RepositoryWhereUniqueInput },
  ) => RepositoryPromise
  updateManyRepositories: (
    args: {
      data: RepositoryUpdateManyMutationInput
      where?: RepositoryWhereInput
    },
  ) => BatchPayloadPromise
  upsertRepository: (
    args: {
      where: RepositoryWhereUniqueInput
      create: RepositoryCreateInput
      update: RepositoryUpdateInput
    },
  ) => RepositoryPromise
  deleteRepository: (where: RepositoryWhereUniqueInput) => RepositoryPromise
  deleteManyRepositories: (where?: RepositoryWhereInput) => BatchPayloadPromise
  createUser: (data: UserCreateInput) => UserPromise
  updateUser: (
    args: { data: UserUpdateInput; where: UserWhereUniqueInput },
  ) => UserPromise
  updateManyUsers: (
    args: { data: UserUpdateManyMutationInput; where?: UserWhereInput },
  ) => BatchPayloadPromise
  upsertUser: (
    args: {
      where: UserWhereUniqueInput
      create: UserCreateInput
      update: UserUpdateInput
    },
  ) => UserPromise
  deleteUser: (where: UserWhereUniqueInput) => UserPromise
  deleteManyUsers: (where?: UserWhereInput) => BatchPayloadPromise

  /**
   * Subscriptions
   */

  $subscribe: Subscription
}

export interface Subscription {
  label: (
    where?: LabelSubscriptionWhereInput,
  ) => LabelSubscriptionPayloadSubscription
  repository: (
    where?: RepositorySubscriptionWhereInput,
  ) => RepositorySubscriptionPayloadSubscription
  user: (
    where?: UserSubscriptionWhereInput,
  ) => UserSubscriptionPayloadSubscription
}

export interface ClientConstructor<T> {
  new (options?: BaseClientOptions): T
}

/**
 * Types
 */

export type LabelOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'githubId_ASC'
  | 'githubId_DESC'
  | 'name_ASC'
  | 'name_DESC'
  | 'color_ASC'
  | 'color_DESC'
  | 'description_ASC'
  | 'description_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'

export type RepositoryOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'name_ASC'
  | 'name_DESC'
  | 'owner_ASC'
  | 'owner_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'

export type UserOrderByInput =
  | 'id_ASC'
  | 'id_DESC'
  | 'githubUserId_ASC'
  | 'githubUserId_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'updatedAt_ASC'
  | 'updatedAt_DESC'

export type MutationType = 'CREATED' | 'UPDATED' | 'DELETED'

export interface LabelUpdateInput {
  githubId?: String
  name?: String
  color?: String
  description?: String
}

export type LabelWhereUniqueInput = AtLeastOne<{
  id: ID_Input
  githubId?: String
}>

export interface LabelUpdateManyWithWhereNestedInput {
  where: LabelScalarWhereInput
  data: LabelUpdateManyDataInput
}

export interface RepositoryCreateInput {
  name: String
  owner: String
  labels?: LabelCreateManyInput
}

export interface UserWhereInput {
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  githubUserId?: String
  githubUserId_not?: String
  githubUserId_in?: String[] | String
  githubUserId_not_in?: String[] | String
  githubUserId_lt?: String
  githubUserId_lte?: String
  githubUserId_gt?: String
  githubUserId_gte?: String
  githubUserId_contains?: String
  githubUserId_not_contains?: String
  githubUserId_starts_with?: String
  githubUserId_not_starts_with?: String
  githubUserId_ends_with?: String
  githubUserId_not_ends_with?: String
  AND?: UserWhereInput[] | UserWhereInput
  OR?: UserWhereInput[] | UserWhereInput
  NOT?: UserWhereInput[] | UserWhereInput
}

export interface LabelUpdateManyMutationInput {
  githubId?: String
  name?: String
  color?: String
  description?: String
}

export interface LabelScalarWhereInput {
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  githubId?: String
  githubId_not?: String
  githubId_in?: String[] | String
  githubId_not_in?: String[] | String
  githubId_lt?: String
  githubId_lte?: String
  githubId_gt?: String
  githubId_gte?: String
  githubId_contains?: String
  githubId_not_contains?: String
  githubId_starts_with?: String
  githubId_not_starts_with?: String
  githubId_ends_with?: String
  githubId_not_ends_with?: String
  name?: String
  name_not?: String
  name_in?: String[] | String
  name_not_in?: String[] | String
  name_lt?: String
  name_lte?: String
  name_gt?: String
  name_gte?: String
  name_contains?: String
  name_not_contains?: String
  name_starts_with?: String
  name_not_starts_with?: String
  name_ends_with?: String
  name_not_ends_with?: String
  color?: String
  color_not?: String
  color_in?: String[] | String
  color_not_in?: String[] | String
  color_lt?: String
  color_lte?: String
  color_gt?: String
  color_gte?: String
  color_contains?: String
  color_not_contains?: String
  color_starts_with?: String
  color_not_starts_with?: String
  color_ends_with?: String
  color_not_ends_with?: String
  description?: String
  description_not?: String
  description_in?: String[] | String
  description_not_in?: String[] | String
  description_lt?: String
  description_lte?: String
  description_gt?: String
  description_gte?: String
  description_contains?: String
  description_not_contains?: String
  description_starts_with?: String
  description_not_starts_with?: String
  description_ends_with?: String
  description_not_ends_with?: String
  AND?: LabelScalarWhereInput[] | LabelScalarWhereInput
  OR?: LabelScalarWhereInput[] | LabelScalarWhereInput
  NOT?: LabelScalarWhereInput[] | LabelScalarWhereInput
}

export interface LabelSubscriptionWhereInput {
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: LabelWhereInput
  AND?: LabelSubscriptionWhereInput[] | LabelSubscriptionWhereInput
  OR?: LabelSubscriptionWhereInput[] | LabelSubscriptionWhereInput
  NOT?: LabelSubscriptionWhereInput[] | LabelSubscriptionWhereInput
}

export interface LabelUpsertWithWhereUniqueNestedInput {
  where: LabelWhereUniqueInput
  update: LabelUpdateDataInput
  create: LabelCreateInput
}

export type RepositoryWhereUniqueInput = AtLeastOne<{
  id: ID_Input
}>

export interface LabelUpdateDataInput {
  githubId?: String
  name?: String
  color?: String
  description?: String
}

export interface RepositoryWhereInput {
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  name?: String
  name_not?: String
  name_in?: String[] | String
  name_not_in?: String[] | String
  name_lt?: String
  name_lte?: String
  name_gt?: String
  name_gte?: String
  name_contains?: String
  name_not_contains?: String
  name_starts_with?: String
  name_not_starts_with?: String
  name_ends_with?: String
  name_not_ends_with?: String
  owner?: String
  owner_not?: String
  owner_in?: String[] | String
  owner_not_in?: String[] | String
  owner_lt?: String
  owner_lte?: String
  owner_gt?: String
  owner_gte?: String
  owner_contains?: String
  owner_not_contains?: String
  owner_starts_with?: String
  owner_not_starts_with?: String
  owner_ends_with?: String
  owner_not_ends_with?: String
  labels_every?: LabelWhereInput
  labels_some?: LabelWhereInput
  labels_none?: LabelWhereInput
  AND?: RepositoryWhereInput[] | RepositoryWhereInput
  OR?: RepositoryWhereInput[] | RepositoryWhereInput
  NOT?: RepositoryWhereInput[] | RepositoryWhereInput
}

export interface LabelUpdateWithWhereUniqueNestedInput {
  where: LabelWhereUniqueInput
  data: LabelUpdateDataInput
}

export interface UserCreateInput {
  githubUserId: String
}

export interface LabelUpdateManyDataInput {
  githubId?: String
  name?: String
  color?: String
  description?: String
}

export interface RepositorySubscriptionWhereInput {
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: RepositoryWhereInput
  AND?: RepositorySubscriptionWhereInput[] | RepositorySubscriptionWhereInput
  OR?: RepositorySubscriptionWhereInput[] | RepositorySubscriptionWhereInput
  NOT?: RepositorySubscriptionWhereInput[] | RepositorySubscriptionWhereInput
}

export interface LabelCreateInput {
  githubId: String
  name: String
  color: String
  description?: String
}

export interface UserUpdateInput {
  githubUserId?: String
}

export interface LabelCreateManyInput {
  create?: LabelCreateInput[] | LabelCreateInput
  connect?: LabelWhereUniqueInput[] | LabelWhereUniqueInput
}

export interface RepositoryUpdateInput {
  name?: String
  owner?: String
  labels?: LabelUpdateManyInput
}

export interface LabelUpdateManyInput {
  create?: LabelCreateInput[] | LabelCreateInput
  update?:
    | LabelUpdateWithWhereUniqueNestedInput[]
    | LabelUpdateWithWhereUniqueNestedInput
  upsert?:
    | LabelUpsertWithWhereUniqueNestedInput[]
    | LabelUpsertWithWhereUniqueNestedInput
  delete?: LabelWhereUniqueInput[] | LabelWhereUniqueInput
  connect?: LabelWhereUniqueInput[] | LabelWhereUniqueInput
  set?: LabelWhereUniqueInput[] | LabelWhereUniqueInput
  disconnect?: LabelWhereUniqueInput[] | LabelWhereUniqueInput
  deleteMany?: LabelScalarWhereInput[] | LabelScalarWhereInput
  updateMany?:
    | LabelUpdateManyWithWhereNestedInput[]
    | LabelUpdateManyWithWhereNestedInput
}

export interface UserSubscriptionWhereInput {
  mutation_in?: MutationType[] | MutationType
  updatedFields_contains?: String
  updatedFields_contains_every?: String[] | String
  updatedFields_contains_some?: String[] | String
  node?: UserWhereInput
  AND?: UserSubscriptionWhereInput[] | UserSubscriptionWhereInput
  OR?: UserSubscriptionWhereInput[] | UserSubscriptionWhereInput
  NOT?: UserSubscriptionWhereInput[] | UserSubscriptionWhereInput
}

export interface LabelWhereInput {
  id?: ID_Input
  id_not?: ID_Input
  id_in?: ID_Input[] | ID_Input
  id_not_in?: ID_Input[] | ID_Input
  id_lt?: ID_Input
  id_lte?: ID_Input
  id_gt?: ID_Input
  id_gte?: ID_Input
  id_contains?: ID_Input
  id_not_contains?: ID_Input
  id_starts_with?: ID_Input
  id_not_starts_with?: ID_Input
  id_ends_with?: ID_Input
  id_not_ends_with?: ID_Input
  githubId?: String
  githubId_not?: String
  githubId_in?: String[] | String
  githubId_not_in?: String[] | String
  githubId_lt?: String
  githubId_lte?: String
  githubId_gt?: String
  githubId_gte?: String
  githubId_contains?: String
  githubId_not_contains?: String
  githubId_starts_with?: String
  githubId_not_starts_with?: String
  githubId_ends_with?: String
  githubId_not_ends_with?: String
  name?: String
  name_not?: String
  name_in?: String[] | String
  name_not_in?: String[] | String
  name_lt?: String
  name_lte?: String
  name_gt?: String
  name_gte?: String
  name_contains?: String
  name_not_contains?: String
  name_starts_with?: String
  name_not_starts_with?: String
  name_ends_with?: String
  name_not_ends_with?: String
  color?: String
  color_not?: String
  color_in?: String[] | String
  color_not_in?: String[] | String
  color_lt?: String
  color_lte?: String
  color_gt?: String
  color_gte?: String
  color_contains?: String
  color_not_contains?: String
  color_starts_with?: String
  color_not_starts_with?: String
  color_ends_with?: String
  color_not_ends_with?: String
  description?: String
  description_not?: String
  description_in?: String[] | String
  description_not_in?: String[] | String
  description_lt?: String
  description_lte?: String
  description_gt?: String
  description_gte?: String
  description_contains?: String
  description_not_contains?: String
  description_starts_with?: String
  description_not_starts_with?: String
  description_ends_with?: String
  description_not_ends_with?: String
  AND?: LabelWhereInput[] | LabelWhereInput
  OR?: LabelWhereInput[] | LabelWhereInput
  NOT?: LabelWhereInput[] | LabelWhereInput
}

export interface UserUpdateManyMutationInput {
  githubUserId?: String
}

export type UserWhereUniqueInput = AtLeastOne<{
  id: ID_Input
  githubUserId?: String
}>

export interface RepositoryUpdateManyMutationInput {
  name?: String
  owner?: String
}

export interface NodeNode {
  id: ID_Output
}

export interface RepositorySubscriptionPayload {
  mutation: MutationType
  node: Repository
  updatedFields: String[]
  previousValues: RepositoryPreviousValues
}

export interface RepositorySubscriptionPayloadPromise
  extends Promise<RepositorySubscriptionPayload>,
    Fragmentable {
  mutation: () => Promise<MutationType>
  node: <T = RepositoryPromise>() => T
  updatedFields: () => Promise<String[]>
  previousValues: <T = RepositoryPreviousValuesPromise>() => T
}

export interface RepositorySubscriptionPayloadSubscription
  extends Promise<AsyncIterator<RepositorySubscriptionPayload>>,
    Fragmentable {
  mutation: () => Promise<AsyncIterator<MutationType>>
  node: <T = RepositorySubscription>() => T
  updatedFields: () => Promise<AsyncIterator<String[]>>
  previousValues: <T = RepositoryPreviousValuesSubscription>() => T
}

export interface RepositoryEdge {
  node: Repository
  cursor: String
}

export interface RepositoryEdgePromise
  extends Promise<RepositoryEdge>,
    Fragmentable {
  node: <T = RepositoryPromise>() => T
  cursor: () => Promise<String>
}

export interface RepositoryEdgeSubscription
  extends Promise<AsyncIterator<RepositoryEdge>>,
    Fragmentable {
  node: <T = RepositorySubscription>() => T
  cursor: () => Promise<AsyncIterator<String>>
}

export interface UserPreviousValues {
  id: ID_Output
  githubUserId: String
}

export interface UserPreviousValuesPromise
  extends Promise<UserPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>
  githubUserId: () => Promise<String>
}

export interface UserPreviousValuesSubscription
  extends Promise<AsyncIterator<UserPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>
  githubUserId: () => Promise<AsyncIterator<String>>
}

export interface RepositoryConnection {
  pageInfo: PageInfo
  edges: RepositoryEdge[]
}

export interface RepositoryConnectionPromise
  extends Promise<RepositoryConnection>,
    Fragmentable {
  pageInfo: <T = PageInfoPromise>() => T
  edges: <T = FragmentableArray<RepositoryEdge>>() => T
  aggregate: <T = AggregateRepositoryPromise>() => T
}

export interface RepositoryConnectionSubscription
  extends Promise<AsyncIterator<RepositoryConnection>>,
    Fragmentable {
  pageInfo: <T = PageInfoSubscription>() => T
  edges: <T = Promise<AsyncIterator<RepositoryEdgeSubscription>>>() => T
  aggregate: <T = AggregateRepositorySubscription>() => T
}

export interface LabelConnection {
  pageInfo: PageInfo
  edges: LabelEdge[]
}

export interface LabelConnectionPromise
  extends Promise<LabelConnection>,
    Fragmentable {
  pageInfo: <T = PageInfoPromise>() => T
  edges: <T = FragmentableArray<LabelEdge>>() => T
  aggregate: <T = AggregateLabelPromise>() => T
}

export interface LabelConnectionSubscription
  extends Promise<AsyncIterator<LabelConnection>>,
    Fragmentable {
  pageInfo: <T = PageInfoSubscription>() => T
  edges: <T = Promise<AsyncIterator<LabelEdgeSubscription>>>() => T
  aggregate: <T = AggregateLabelSubscription>() => T
}

export interface Repository {
  id: ID_Output
  name: String
  owner: String
}

export interface RepositoryPromise extends Promise<Repository>, Fragmentable {
  id: () => Promise<ID_Output>
  name: () => Promise<String>
  owner: () => Promise<String>
  labels: <T = FragmentableArray<Label>>(
    args?: {
      where?: LabelWhereInput
      orderBy?: LabelOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => T
}

export interface RepositorySubscription
  extends Promise<AsyncIterator<Repository>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>
  name: () => Promise<AsyncIterator<String>>
  owner: () => Promise<AsyncIterator<String>>
  labels: <T = Promise<AsyncIterator<LabelSubscription>>>(
    args?: {
      where?: LabelWhereInput
      orderBy?: LabelOrderByInput
      skip?: Int
      after?: String
      before?: String
      first?: Int
      last?: Int
    },
  ) => T
}

export interface PageInfo {
  hasNextPage: Boolean
  hasPreviousPage: Boolean
  startCursor?: String
  endCursor?: String
}

export interface PageInfoPromise extends Promise<PageInfo>, Fragmentable {
  hasNextPage: () => Promise<Boolean>
  hasPreviousPage: () => Promise<Boolean>
  startCursor: () => Promise<String>
  endCursor: () => Promise<String>
}

export interface PageInfoSubscription
  extends Promise<AsyncIterator<PageInfo>>,
    Fragmentable {
  hasNextPage: () => Promise<AsyncIterator<Boolean>>
  hasPreviousPage: () => Promise<AsyncIterator<Boolean>>
  startCursor: () => Promise<AsyncIterator<String>>
  endCursor: () => Promise<AsyncIterator<String>>
}

export interface AggregateLabel {
  count: Int
}

export interface AggregateLabelPromise
  extends Promise<AggregateLabel>,
    Fragmentable {
  count: () => Promise<Int>
}

export interface AggregateLabelSubscription
  extends Promise<AsyncIterator<AggregateLabel>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Int>>
}

export interface UserEdge {
  node: User
  cursor: String
}

export interface UserEdgePromise extends Promise<UserEdge>, Fragmentable {
  node: <T = UserPromise>() => T
  cursor: () => Promise<String>
}

export interface UserEdgeSubscription
  extends Promise<AsyncIterator<UserEdge>>,
    Fragmentable {
  node: <T = UserSubscription>() => T
  cursor: () => Promise<AsyncIterator<String>>
}

export interface LabelEdge {
  node: Label
  cursor: String
}

export interface LabelEdgePromise extends Promise<LabelEdge>, Fragmentable {
  node: <T = LabelPromise>() => T
  cursor: () => Promise<String>
}

export interface LabelEdgeSubscription
  extends Promise<AsyncIterator<LabelEdge>>,
    Fragmentable {
  node: <T = LabelSubscription>() => T
  cursor: () => Promise<AsyncIterator<String>>
}

export interface Label {
  id: ID_Output
  githubId: String
  name: String
  color: String
  description?: String
}

export interface LabelPromise extends Promise<Label>, Fragmentable {
  id: () => Promise<ID_Output>
  githubId: () => Promise<String>
  name: () => Promise<String>
  color: () => Promise<String>
  description: () => Promise<String>
}

export interface LabelSubscription
  extends Promise<AsyncIterator<Label>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>
  githubId: () => Promise<AsyncIterator<String>>
  name: () => Promise<AsyncIterator<String>>
  color: () => Promise<AsyncIterator<String>>
  description: () => Promise<AsyncIterator<String>>
}

export interface AggregateRepository {
  count: Int
}

export interface AggregateRepositoryPromise
  extends Promise<AggregateRepository>,
    Fragmentable {
  count: () => Promise<Int>
}

export interface AggregateRepositorySubscription
  extends Promise<AsyncIterator<AggregateRepository>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Int>>
}

export interface UserSubscriptionPayload {
  mutation: MutationType
  node: User
  updatedFields: String[]
  previousValues: UserPreviousValues
}

export interface UserSubscriptionPayloadPromise
  extends Promise<UserSubscriptionPayload>,
    Fragmentable {
  mutation: () => Promise<MutationType>
  node: <T = UserPromise>() => T
  updatedFields: () => Promise<String[]>
  previousValues: <T = UserPreviousValuesPromise>() => T
}

export interface UserSubscriptionPayloadSubscription
  extends Promise<AsyncIterator<UserSubscriptionPayload>>,
    Fragmentable {
  mutation: () => Promise<AsyncIterator<MutationType>>
  node: <T = UserSubscription>() => T
  updatedFields: () => Promise<AsyncIterator<String[]>>
  previousValues: <T = UserPreviousValuesSubscription>() => T
}

export interface LabelPreviousValues {
  id: ID_Output
  githubId: String
  name: String
  color: String
  description?: String
}

export interface LabelPreviousValuesPromise
  extends Promise<LabelPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>
  githubId: () => Promise<String>
  name: () => Promise<String>
  color: () => Promise<String>
  description: () => Promise<String>
}

export interface LabelPreviousValuesSubscription
  extends Promise<AsyncIterator<LabelPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>
  githubId: () => Promise<AsyncIterator<String>>
  name: () => Promise<AsyncIterator<String>>
  color: () => Promise<AsyncIterator<String>>
  description: () => Promise<AsyncIterator<String>>
}

export interface LabelSubscriptionPayload {
  mutation: MutationType
  node: Label
  updatedFields: String[]
  previousValues: LabelPreviousValues
}

export interface LabelSubscriptionPayloadPromise
  extends Promise<LabelSubscriptionPayload>,
    Fragmentable {
  mutation: () => Promise<MutationType>
  node: <T = LabelPromise>() => T
  updatedFields: () => Promise<String[]>
  previousValues: <T = LabelPreviousValuesPromise>() => T
}

export interface LabelSubscriptionPayloadSubscription
  extends Promise<AsyncIterator<LabelSubscriptionPayload>>,
    Fragmentable {
  mutation: () => Promise<AsyncIterator<MutationType>>
  node: <T = LabelSubscription>() => T
  updatedFields: () => Promise<AsyncIterator<String[]>>
  previousValues: <T = LabelPreviousValuesSubscription>() => T
}

export interface RepositoryPreviousValues {
  id: ID_Output
  name: String
  owner: String
}

export interface RepositoryPreviousValuesPromise
  extends Promise<RepositoryPreviousValues>,
    Fragmentable {
  id: () => Promise<ID_Output>
  name: () => Promise<String>
  owner: () => Promise<String>
}

export interface RepositoryPreviousValuesSubscription
  extends Promise<AsyncIterator<RepositoryPreviousValues>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>
  name: () => Promise<AsyncIterator<String>>
  owner: () => Promise<AsyncIterator<String>>
}

export interface BatchPayload {
  count: Long
}

export interface BatchPayloadPromise
  extends Promise<BatchPayload>,
    Fragmentable {
  count: () => Promise<Long>
}

export interface BatchPayloadSubscription
  extends Promise<AsyncIterator<BatchPayload>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Long>>
}

export interface User {
  id: ID_Output
  githubUserId: String
}

export interface UserPromise extends Promise<User>, Fragmentable {
  id: () => Promise<ID_Output>
  githubUserId: () => Promise<String>
}

export interface UserSubscription
  extends Promise<AsyncIterator<User>>,
    Fragmentable {
  id: () => Promise<AsyncIterator<ID_Output>>
  githubUserId: () => Promise<AsyncIterator<String>>
}

export interface UserConnection {
  pageInfo: PageInfo
  edges: UserEdge[]
}

export interface UserConnectionPromise
  extends Promise<UserConnection>,
    Fragmentable {
  pageInfo: <T = PageInfoPromise>() => T
  edges: <T = FragmentableArray<UserEdge>>() => T
  aggregate: <T = AggregateUserPromise>() => T
}

export interface UserConnectionSubscription
  extends Promise<AsyncIterator<UserConnection>>,
    Fragmentable {
  pageInfo: <T = PageInfoSubscription>() => T
  edges: <T = Promise<AsyncIterator<UserEdgeSubscription>>>() => T
  aggregate: <T = AggregateUserSubscription>() => T
}

export interface AggregateUser {
  count: Int
}

export interface AggregateUserPromise
  extends Promise<AggregateUser>,
    Fragmentable {
  count: () => Promise<Int>
}

export interface AggregateUserSubscription
  extends Promise<AsyncIterator<AggregateUser>>,
    Fragmentable {
  count: () => Promise<AsyncIterator<Int>>
}

export type Long = string

/*
The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1. 
*/
export type Int = number

/*
The `Boolean` scalar type represents `true` or `false`.
*/
export type Boolean = boolean

/*
The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.
*/
export type ID_Input = string | number
export type ID_Output = string

/*
The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.
*/
export type String = string

/**
 * Model Metadata
 */

export const models: Model[] = [
  {
    name: 'User',
    embedded: false,
  },
  {
    name: 'Repository',
    embedded: false,
  },
  {
    name: 'Label',
    embedded: false,
  },
]

/**
 * Type Defs
 */

export const Prisma = makePrismaClientClass<ClientConstructor<Prisma>>({
  typeDefs,
  models,
  endpoint: `https://eu1.prisma.sh/matic-zavadlal-03c51f/label-sync/dev`,
})
export const prisma = new Prisma()
