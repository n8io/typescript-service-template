CREATE TABLE "resources" (
	"createdAt" timestamp (3) NOT NULL,
	"createdBy" jsonb NOT NULL,
	"gid" varchar(255) NOT NULL,
	"updatedAt" timestamp (3) NOT NULL,
	"updatedBy" jsonb NOT NULL,
	"name" varchar(255) NOT NULL,
	"timeZone" varchar(255),
	"id" varchar(255) NOT NULL,
	CONSTRAINT "resources_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "udx_resources_gid" ON "resources" USING btree ("gid");--> statement-breakpoint
CREATE UNIQUE INDEX "udx_resources_name" ON "resources" USING btree ("name");