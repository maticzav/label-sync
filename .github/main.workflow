workflow "Prisma Repositories Issue Labeling" {
  on = "push"
  resolves = ["Github Labels"]
}

action "Github Labels" {
  uses = "./"
  secrets = ["GITHUB_TOKEN"]
}
