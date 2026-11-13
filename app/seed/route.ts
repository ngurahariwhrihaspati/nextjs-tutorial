import bcrypt from 'bcrypt'
import postgres from 'postgres'
import { invoices, customers, revenue, users } from '../lib/placeholder-data'

export async function GET() {
  const connectionString =
    process.env.STORAGE_POSTGRES_URL_NON_POOLING ??
    process.env.STORAGE_POSTGRES_URL

  if (!connectionString) {
    return Response.json(
      { error: 'Missing STORAGE_POSTGRES_URL_NON_POOLING or STORAGE_POSTGRES_URL' },
      { status: 500 }
    )
  }

  const sql = postgres(connectionString, { ssl: 'require' })

  try {
    await sql.begin(async (tx) => {
      await tx`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `
      await tx`
        CREATE TABLE IF NOT EXISTS customers (
          id UUID PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          image_url VARCHAR(255) NOT NULL
        )
      `
      await tx`
        CREATE TABLE IF NOT EXISTS invoices (
          id UUID PRIMARY KEY,
          customer_id UUID NOT NULL,
          amount INT NOT NULL,
          status VARCHAR(255) NOT NULL,
          date DATE NOT NULL
        )
      `
      await tx`
        CREATE TABLE IF NOT EXISTS revenue (
          month VARCHAR(4) NOT NULL UNIQUE,
          revenue INT NOT NULL
        )
      `

      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, 10)
        await tx`
          INSERT INTO users (id, name, email, password)
          VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
          ON CONFLICT (id) DO NOTHING
        `
      }

      for (const customer of customers) {
        await tx`
          INSERT INTO customers (id, name, email, image_url)
          VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
          ON CONFLICT (id) DO NOTHING
        `
      }

      for (const invoice of invoices) {
        await tx`
          INSERT INTO invoices (id, customer_id, amount, status, date)
          VALUES (${invoice.id}, ${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
          ON CONFLICT (id) DO NOTHING
        `
      }

      for (const item of revenue) {
        await tx`
          INSERT INTO revenue (month, revenue)
          VALUES (${item.month}, ${item.revenue})
          ON CONFLICT (month) DO NOTHING
        `
      }
    })

    return Response.json({ message: 'Database seeded successfully' })
  } catch (error) {
    console.error('Database seeding failed:', error)
    return Response.json(
      { error: 'Database seeding failed. Check the server logs for details.' },
      { status: 500 }
    )
  } finally {
    await sql.end()
  }
}
