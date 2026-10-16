# KejaMarket Testing Guide
## How to Test Your Optimized Website

---

## 🚀 Quick Start

### Prerequisites
- Node.js installed
- Server running locally or deployed
- Internet connection for deployed tests

### Start the Server
```bash
# Development (single process)
npm run dev

# Production (PM2 cluster)
npm start
```

Wait for:
```
✅ PostgreSQL database connected successfully
Server running on port 3001
```

---

## 🧪 Test Suites

### 1. System Tests (Recommended First)
**Purpose:** Verify all critical functionality works correctly

```bash
npm run test:system
```

**Tests Included:**
- ✅ Health endpoint & database connectivity
- ✅ Cache system operational
- ✅ API functionality (properties, locations, stats)
- ✅ Rate limiting configuration
- ✅ Response compression
- ✅ Security headers
- ✅ Cache performance
- ✅ Database queries
- ✅ 50 concurrent requests
- ✅ Frontend integration

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════╗
║  KejaMarket End-to-End System Test Suite                 ║
╚═══════════════════════════════════════════════════════════╝

━━━ Health & Monitoring Tests ━━━
✓ Health endpoint responds (45ms)
✓ Database connection healthy
✓ Cache system operational

━━━ API Functionality Tests ━━━
✓ Properties API returns data (120ms)
✓ Locations hierarchy API (85ms)
✓ Stats API responds (95ms)

... [more tests]

━━━ Test Summary ━━━
Total Tests:    15
Passed:         15
Failed:         0
Warnings:       0
Success Rate:   100.0%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall Status: PASSED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**What Success Means:**
- All endpoints responding correctly
- Database connected and performing well
- Cache working with good hit rate
- Rate limiting active
- Security measures in place

---

### 2. Load Tests

#### Light Load (100 users)
**Purpose:** Basic load testing, verify system handles moderate traffic

```bash
npm run test:load
```

**Configuration:**
- Users: 100
- Requests per user: 10
- Total requests: 1,000
- Ramp-up: 5 seconds

**Expected Results:**
- Success Rate: >99%
- Mean Response Time: <300ms
- 95th Percentile: <500ms
- Throughput: >50 req/s

---

#### Medium Load (500 users)
**Purpose:** Realistic production load testing

```bash
npm run test:load:medium
```

**Configuration:**
- Users: 500
- Requests per user: 20
- Total requests: 10,000
- Ramp-up: 5 seconds

**Expected Results:**
- Success Rate: >98%
- Mean Response Time: <400ms
- 95th Percentile: <800ms
- Throughput: >100 req/s

---

#### Heavy Load (1000 users)
**Purpose:** Stress testing, verify 10K+ user capacity

```bash
npm run test:load:heavy
```

**Configuration:**
- Users: 1,000
- Requests per user: 50
- Total requests: 50,000
- Ramp-up: 5 seconds

**Expected Results:**
- Success Rate: >95%
- Mean Response Time: <600ms
- 95th Percentile: <1000ms
- Throughput: >200 req/s

---

#### Custom Load Test
```bash
node load-test.js <USERS> <REQUESTS_PER_USER>

# Examples:
node load-test.js 2000 100    # 2000 users, 100 req each
node load-test.js 5000 10     # 5000 users, 10 req each
```

---

## 📊 Understanding Test Results

### System Test Results

#### ✅ All Tests Passing
```
Total Tests:    15
Passed:         15
Failed:         0
Success Rate:   100.0%
Overall Status: PASSED ✓
```
**Action:** System is healthy, proceed to load testing

---

#### ⚠️ Warnings Present
```
Total Tests:    15
Passed:         14
Failed:         0
Warnings:       2
```
**Common Warnings:**
- Low cache hit rate (needs warm-up)
- High memory usage (monitor)
- Slow response time (check database)

**Action:** Review warnings, may need optimization

---

#### ❌ Tests Failing
```
Total Tests:    15
Passed:         10
Failed:         5
Overall Status: FAILED ✗
```
**Action:** Fix failures before production:
1. Check server is running
2. Verify database connection
3. Review error messages
4. Check environment variables

---

### Load Test Results

#### 🟢 Excellent Performance
```
━━━ Results Summary ━━━
Success Rate:       99.8%
Mean Response:      245ms
95th Percentile:    420ms
Throughput:         85 req/s

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall: EXCELLENT - Ready for 10,000+ users! ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
**Action:** Production-ready!

---

#### 🟡 Good Performance (Minor Issues)
```
Success Rate:       98.2%
Mean Response:      450ms
95th Percentile:    820ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall: GOOD - Minor optimizations recommended
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
**Action:** Can deploy but consider:
- Increase database pool size
- Add more CPU cores
- Optimize slow queries

---

#### 🔴 Needs Improvement
```
Success Rate:       92.5%
Mean Response:      1250ms
95th Percentile:    2400ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Overall: NEEDS IMPROVEMENT - Review failures above
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
**Action:** Fix issues before production:
1. Check database connection pool
2. Review server resources (CPU/memory)
3. Optimize slow queries
4. Consider horizontal scaling

---

## 🔍 Monitoring During Tests

### Check Health Endpoint
```bash
curl http://localhost:3001/api/health
```

**Monitor:**
- Database pool stats (idle connections)
- Memory usage
- Cache hit rate
- Uptime

---

### Check Cache Stats
```bash
curl http://localhost:3001/api/cache-stats
```

**Target Metrics:**
- Hit rate: >80%
- Size: <250 entries

---

### PM2 Monitoring
```bash
pm2 monit
pm2 list
pm2 logs
```

**Watch For:**
- Worker restarts
- Memory usage
- CPU usage
- Error logs

---

## 🐛 Common Issues & Solutions

### Issue: Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
**Solution:** Server not running
```bash
npm run dev
# or
npm start
```

---

### Issue: Database Not Connected
```
✗ Database connection healthy
  DB Status: disconnected
```
**Solution:** Check DATABASE_URL environment variable
```bash
# Verify .env file exists
cat .env | grep DATABASE_URL

# Or set manually
export DATABASE_URL="postgresql://..."
```

---

### Issue: Low Cache Hit Rate
```
⚠ Low cache hit rate: 12.5% (warm up needed)
```
**Solution:** Warm up cache by browsing
```bash
# Make several requests to popular endpoints
curl http://localhost:3001/api/properties?limit=20
curl http://localhost:3001/api/properties?limit=20  # Should hit cache
curl http://localhost:3001/api/locations/hierarchy
```

---

### Issue: Rate Limited During Tests
```
Rate Limited (429): 250 requests
```
**Solution:** Normal behavior, rate limiting is working
- Adjust rate limits if needed (server.js)
- Or spread requests over time in custom tests

---

### Issue: Timeouts
```
Timeout Count: 45
Timeout %: 4.5%
```
**Solutions:**
1. Increase query timeout in postgres-store.js
2. Add database indexes
3. Optimize slow queries
4. Check network latency

---

## 📈 Performance Targets

| Metric | Target | Excellent | Good | Poor |
|--------|--------|-----------|------|------|
| Success Rate | >99% | 99.5%+ | 98-99% | <98% |
| Mean Response | <300ms | <200ms | 200-400ms | >400ms |
| P95 Response | <500ms | <400ms | 400-800ms | >800ms |
| P99 Response | <1000ms | <800ms | 800-1500ms | >1500ms |
| Throughput | >50 req/s | >100 req/s | 50-100 req/s | <50 req/s |
| Cache Hit Rate | >80% | >90% | 80-90% | <80% |
| Error Rate | <1% | <0.5% | 0.5-1% | >1% |

---

## 🎯 Testing Checklist

### Pre-Deployment Testing:
- [ ] Run system tests (`npm run test:system`)
- [ ] All tests passing (0 failures)
- [ ] Warnings reviewed and addressed
- [ ] Run light load test (`npm run test:load`)
- [ ] Success rate >99%
- [ ] Response times acceptable
- [ ] Run medium load test (`npm run test:load:medium`)
- [ ] No critical errors
- [ ] Database pool not saturated
- [ ] Check `/api/health` endpoint
- [ ] Cache hit rate >80%
- [ ] Memory usage stable
- [ ] Review PM2 logs for errors

### Post-Deployment Testing:
- [ ] Run system tests against production URL
- [ ] Monitor error rates in production
- [ ] Check database performance
- [ ] Review cache effectiveness
- [ ] Monitor memory usage
- [ ] Set up alerts for high error rates

---

## 🚦 Testing Strategy

### 1. Development Testing
**Frequency:** Every code change
```bash
npm run test:system
```

### 2. Pre-Deployment Testing
**Frequency:** Before each deployment
```bash
npm run test:system && npm run test:load
```

### 3. Load Testing
**Frequency:** Weekly or after major changes
```bash
npm run test:load:medium
```

### 4. Stress Testing
**Frequency:** Monthly or before major events
```bash
npm run test:load:heavy
```

### 5. Production Monitoring
**Frequency:** Continuous
- Set up monitoring dashboard
- Configure alerts
- Review logs daily

---

## 📞 Getting Help

### Test Failures
1. Review error messages in test output
2. Check server logs: `pm2 logs`
3. Verify environment variables
4. Check database connectivity
5. Review OPTIMIZATION_COMPLETE.md

### Performance Issues
1. Check `/api/health` for system stats
2. Review database pool statistics
3. Check cache hit rate
4. Monitor memory/CPU usage
5. Review DATABASE_OPTIMIZATION_COMPLETE.md

### Custom Testing
- Modify `test-system.js` for specific tests
- Adjust `load-test.js` scenarios for your use case
- Create custom test scripts as needed

---

## 🎓 Best Practices

1. **Always test locally before deploying**
2. **Run system tests first, then load tests**
3. **Start with light load, gradually increase**
4. **Monitor during tests (PM2, health endpoint)**
5. **Review all warnings, even if tests pass**
6. **Test with realistic user scenarios**
7. **Keep test results for comparison**
8. **Automate tests in CI/CD pipeline**

---

**Ready to test? Start here:**
```bash
npm run test:system
```

Good luck! 🚀
