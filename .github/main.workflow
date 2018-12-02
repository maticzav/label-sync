workflow "New workflow" {
  on = "push"
  resolves = ["Github Labels"]
}

action "Github Labels" {
  uses = "./"
  secrets = ["GITHUB_TOKEN"]
}
