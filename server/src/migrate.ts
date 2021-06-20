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
