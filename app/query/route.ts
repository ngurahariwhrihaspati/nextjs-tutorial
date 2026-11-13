import postgres from 'postgres'

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
    const invoices = await sql`
      SELECT invoices.amount, customers.name
      FROM invoices
      JOIN customers ON invoices.customer_id = customers.id
      WHERE invoices.amount = 666
    `

    return Response.json(invoices)
  } catch (error) {
    console.error('Invoice query failed:', error)
    return Response.json(
      { error: 'Invoice query failed. Check the server logs for details.' },
      { status: 500 }
    )
  } finally {
    await sql.end()
  }
}
