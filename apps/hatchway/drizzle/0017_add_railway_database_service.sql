-- Add Railway database service ID column to projects table
-- This tracks the Postgres database service provisioned via Railway's templateDeployV2
ALTER TABLE "projects" ADD COLUMN "railway_database_service_id" text;
