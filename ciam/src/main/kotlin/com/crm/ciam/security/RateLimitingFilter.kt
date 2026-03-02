package com.crm.ciam.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

@Component
class RateLimitingFilter(
    @Value("\${app.rate-limit.max-attempts:10}") private val maxAttempts: Int,
    @Value("\${app.rate-limit.window-seconds:300}") windowSeconds: Int
) : OncePerRequestFilter() {

    private val windowMs: Long = windowSeconds * 1000L
    private val attempts = ConcurrentHashMap<String, AttemptRecord>()

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val ip = getClientIp(request)
        val now = System.currentTimeMillis()

        attempts.entries.removeIf { now - it.value.windowStart > windowMs }

        val record = attempts.compute(ip) { _, existing ->
            if (existing == null || now - existing.windowStart > windowMs) {
                AttemptRecord(now, AtomicInteger(1))
            } else {
                existing.count.incrementAndGet()
                existing
            }
        }!!

        if (record.count.get() > maxAttempts) {
            response.contentType = "application/json"
            response.status = HttpStatus.TOO_MANY_REQUESTS.value()
            response.writer.write("""{"status":429,"message":"Zu viele Anfragen. Bitte warten Sie."}""")
            return
        }

        filterChain.doFilter(request, response)
    }

    override fun shouldNotFilter(request: HttpServletRequest): Boolean =
        !("/api/auth/login" == request.requestURI && "POST".equals(request.method, ignoreCase = true))

    private fun getClientIp(request: HttpServletRequest): String {
        val xForwardedFor = request.getHeader("X-Forwarded-For")
        if (!xForwardedFor.isNullOrEmpty()) {
            return xForwardedFor.split(",")[0].trim()
        }
        return request.remoteAddr
    }

    private data class AttemptRecord(val windowStart: Long, val count: AtomicInteger)
}
