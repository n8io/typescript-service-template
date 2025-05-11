# Database Best Practices

This project uses PostgreSQL with Drizzle ORM for database management.

1. Never directly create, modify, or apply migration files in `../..src/spi/repositories/database/migrations/*`. This directory and its contents are to be considered read only.
2. Migrations are automatically generated after [schema.ts](../src/spi/repositories/database/schema.ts) changes (and its dependencies) are made and the following command is ran: `nvm install && npm run db:migrate`

## Database Connection

The database connection is managed through the SPI layer and configured via environment variables:

- `DATABASE_URL` - PostgreSQL connection string
