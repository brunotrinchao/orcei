export default defineEventHandler((event) => {
  return sendRedirect(event, '/api/auth/google')
})
