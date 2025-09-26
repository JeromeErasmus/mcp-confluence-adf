# Getting Started with WeatherAPI Pro

~~~panel type=info title="Welcome"
WeatherAPI Pro is a comprehensive weather data service that provides real-time weather information, forecasts, and historical data for any location worldwide. With simple HTTP endpoints and reliable uptime, you can integrate weather data into your applications quickly and efficiently. Whether you're building a mobile app, web dashboard, or IoT project, WeatherAPI Pro delivers accurate weather insights to enhance your user experience.
~~~

## Prerequisites

## Requirements

Before installing WeatherAPI Pro, ensure your system meets these requirements:

| Component | Minimum Version | Recommended |
|-----------|----------------|-------------|
| Node.js | 16.0.0+ | 18.0.0+ |
| npm | 7.0.0+ | 8.0.0+ |
| Operating System | Any | Linux, macOS, Windows 10+ |
| Memory | 512MB RAM | 1GB+ RAM |

**Additional Requirements:**
- Internet connection for API calls
- Valid WeatherAPI Pro account and API key
- Basic knowledge of JavaScript/Node.js

## Installation

### Quick Install

```bash
npm install weatherapi-pro
```

For global installation (CLI usage):

```bash
npm install -g weatherapi-pro
```

## Verification

To verify your installation was successful, run this simple command:

```bash
weatherapi-pro --version
```

You should see the version number displayed. You can also test the API connection:

```bash
weatherapi-pro test-connection
```

~~~panel type=success title="Success"
If you see "✅ Connection successful" and the current weather for London, your installation is working perfectly!
~~~

## Basic Usage

## First Steps

Here's your first weather API call - get the current weather for any city:

```javascript
const WeatherAPI = require('weatherapi-pro');

// Initialize with your API key
const weather = new WeatherAPI('your-api-key-here');

// Get current weather
async function getCurrentWeather() {
  try {
    const data = await weather.current('London');
    console.log(`Temperature in ${data.location.name}: ${data.current.temp_c}°C`);
    console.log(`Condition: ${data.current.condition.text}`);
  } catch (error) {
    console.error('Error fetching weather:', error.message);
  }
}

getCurrentWeather();
```

**Expected output:**
```
Temperature in London: 18°C
Condition: Partly cloudy
```

### You're All Set!

~~~panel type=success title="You're All Set!"
Congratulations! You've successfully installed WeatherAPI Pro and made your first API call. You're now ready to integrate weather data into your applications. 

**What's next?**
- Explore the [API Reference](docs/api-reference) for all available endpoints
- Check out [Code Examples](docs/examples) for common use cases
- Join our [Developer Community](community.weatherapi.pro) for tips and support
~~~

## Troubleshooting

### Common Issues

~~~expand title="Common Issues"

**Issue 1: "API Key Invalid" Error**
- **Cause**: Missing or incorrect API key
- **Solution**: Double-check your API key in the [dashboard](dashboard.weatherapi.pro) and ensure it's properly set in your code

**Issue 2: "Rate Limit Exceeded" Error**
- **Cause**: Too many API calls per minute/hour
- **Solution**: Implement request caching or upgrade to a higher tier plan. Free tier allows 100 calls/hour

**Issue 3: "Location Not Found" Error**
- **Cause**: Invalid location parameter
- **Solution**: Use specific city names, coordinates (lat,lon), or IP addresses. Example: "London,UK" instead of just "London"

**Still having issues?** Check our [FAQ](docs/faq) or contact support at support@weatherapi.pro
~~~

## Next Steps

## Learn More

Ready to dive deeper? Here are your next steps:

**📚 Documentation**
- [Complete API Reference](docs/api-reference) - All endpoints and parameters
- [Authentication Guide](docs/authentication) - API key management and security
- [Response Formats](docs/responses) - Understanding weather data structure

**💡 Examples & Tutorials**
- [Integration Examples](docs/examples) - React, Vue, Express.js implementations
- [Advanced Features](docs/advanced) - Batch requests, webhooks, historical data
- [Video Tutorials](youtube.com/weatherapipro) - Step-by-step coding guides

**🚀 Tools & Resources**
- [API Testing Console](console.weatherapi.pro) - Test endpoints without coding
- [SDKs & Libraries](github.com/weatherapi-pro) - Official libraries for Python, PHP, Java
- [Status Page](status.weatherapi.pro) - Real-time service status and uptime

**🤝 Community**
- [Developer Forum](community.weatherapi.pro) - Ask questions and share solutions
- [Discord Server](discord.gg/weatherapi) - Real-time chat with developers
- [Newsletter](newsletter.weatherapi.pro) - Latest features and best practices