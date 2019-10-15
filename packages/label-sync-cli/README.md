# label-sync

> This is a legacy feature. Refer to the `/examples` folder for spec.

```json
{
  "version": "1",
  "repos": {
    "graphql-middleware": {
      "labels": [
        {
          "name": "kind/bug",
          "description": "Label outlining a bug.",
          "color": "#123fff",
          "siblings": [],
          "hooks": [
            {
              "integration": "webhook",
              "endpoint": "https://myapi.com/{label.name}"
            },
            {
              "integration": "slack",
              "user": "maticzav"
            }
          ]
        }
      ]
    }
  }
}
```
