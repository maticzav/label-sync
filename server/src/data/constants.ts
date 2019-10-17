/**
 * Configuration repository is the repository which LabelSync
 * uses to determine the configuration of the service.
 *
 * @param organization
 */
export const labelSyncConfigurationRepository = (owner: string) =>
  `${owner}-labelsync`

/**
 * Configuration file path determines the path of the file in the repositoy
 * that we use to gather configuration information from.
 *
 * It should always be in YAML format.
 */
export const labelSyncConfigurationFilePath = 'labelsync.yml'
