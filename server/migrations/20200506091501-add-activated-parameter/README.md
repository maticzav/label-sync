# Migration `20200506091501-add-activated-parameter`

This migration has been generated by maticzav at 5/6/2020, 9:15:01 AM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
ALTER TABLE "public"."Installation" ADD COLUMN "activated" boolean  NOT NULL DEFAULT false;
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20200505160306-billing-model..20200506091501-add-activated-parameter
--- datamodel.dml
+++ datamodel.dml
@@ -1,7 +1,7 @@
 datasource postgresql {
   provider = "postgresql"
-  url = "***"
+  url      = env("POSTGRESQL_URL")
 }
 generator client {
   provider = "prisma-client-js"
@@ -15,8 +15,10 @@
   account      String   @unique
   email        String?
   plan         Plan
   periodEndsAt DateTime
+  // Manager properties
+  activated    Boolean  @default(false)
 }
 enum Plan {
   FREE
```
