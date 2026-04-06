# ML Service Hosting Guide (Windows Local Server)

This guide covers how to deploy the standalone Python ML-Service on a Windows server. By doing this, you can safely skip the Node.js backend entirely and allow your `.NET` applications to consume the machine learning endpoints directly.

## Deployment Options

Since the standalone ML-service uses Uvicorn (an ASGI server) which doesn't run perfectly natively as a background daemon on Windows, we wrap the process using tools like **PM2** or **NSSM** to ensure it runs constantly and automatically recovers from crashes or system reboots.

### Option A: Using PM2 (Recommended if Node.js is installed)

PM2 is a production process manager that works excellently for Python processes.

1. **Install PM2 globally:**

   ```powershell
   npm install -g pm2
   ```

2. **Navigate into your ML-Service directory:**

   ```powershell
   cd c:\Users\rishi.gaware\Desktop\dvms_recommendation\ml-service
   ```

3. **Start the service:**
   Binding the host to `0.0.0.0` ensures the service can receive requests from other computers on your network (not just localhost).

   ```powershell
   pm2 start "python -m uvicorn app.main:app --host 0.0.0.0 --port 8000" --name ml-api
   ```

4. **Save the configuration to start on Windows boot:**
   ```powershell
   pm2 save
   pm2 startup
   ```

### Option B: Using NSSM (Best for Native Windows Services)

If you prefer the ML Service to show up inside the standard `services.msc` Windows console:

1. Download **[NSSM (Non-Sucking Service Manager)](https://nssm.cc/)**.
2. Open Command Prompt as Administrator and run:
   ```cmd
   nssm install ml-service
   ```
3. A graphical window will open. Configure it exactly as follows:
   - **Path:** The location of your python executable (e.g., `C:\Python311\python.exe` or your virtual environment python path)
   - **Arguments:** `-m uvicorn app.main:app --host 0.0.0.0 --port 8000`
   - **Directory:** `c:\Users\rishi.gaware\Desktop\dvms_recommendation\ml-service`
4. Click **Install service**. You can now manually start it from your Windows Services interface.

---

## Communicating with the Service via .NET

Now that the ML-service is running on the local server independently, your `.NET` app can easily make REST API calls to it.

```csharp
using System.Net.Http;
using System.Text.Json;
using System.Text;
using System.Threading.Tasks;

public class MLServiceClient
{
    private readonly HttpClient _httpClient;

    // Replace "localhost" with your server's IP address if the .NET app is on a different machine
    private const string MlServiceUrl = "http://localhost:8000/api/analyze";

    public MLServiceClient()
    {
        _httpClient = new HttpClient();
    }

    public async Task<string> AnalyzeDeviationAsync(object payload)
    {
        // 1. Serialize the payload to JSON matching what the ML service expects
        var jsonPayload = JsonSerializer.Serialize(payload);
        var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

        // 2. Make the HTTP POST call to the ML Service
        var response = await _httpClient.PostAsync(MlServiceUrl, content);

        response.EnsureSuccessStatusCode();

        // 3. Read and return the JSON response (Root Causes, etc.)
        return await response.Content.ReadAsStringAsync();
    }
}
```
