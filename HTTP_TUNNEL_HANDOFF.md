# HTTP Tunnel Handoff — AP Physics 1 Simulation

## Objective

Make the locally running AP Physics 1 projectile-motion simulation accessible to someone geographically far away through a temporary public HTTPS URL.

The remote user should only need a normal web browser.

The developer's machine should continue running the simulation locally while an HTTP/HTTPS tunnel forwards public traffic to the local development server.

---

# 1. Current Architecture

The simulation is a web application running locally.

Assume the development server is:

```text
http://localhost:5173
```

If the framework uses another port, detect and use the actual port instead.

The tunnel must forward:

```text
Public HTTPS URL
        ↓
HTTP tunnel
        ↓
localhost:<DEV_PORT>
        ↓
Physics simulation
```

Do not expose the development machine through manual router port forwarding unless absolutely necessary.

---

# 2. Primary Tunnel Requirement

Use an HTTP tunneling service capable of generating a publicly accessible HTTPS URL.

Preferred implementation:

**Cloudflare Tunnel / cloudflared quick tunnel**

The basic behavior should be equivalent to:

```bash
cloudflared tunnel --url http://localhost:5173
```

The actual command should use the detected development-server port.

The command should produce a public URL similar to:

```text
https://random-name.trycloudflare.com
```

That URL should be accessible from another network and another geographic location.

---

# 3. Do Not Hard-Code the Port

The implementation should first determine which port the simulation is running on.

Possible development-server ports include:

```text
3000
4173
5173
8000
8080
```

The agent should inspect the project's configuration and package scripts instead of assuming one.

For example, inspect:

```text
package.json
vite.config.*
next.config.*
README.*
```

and determine the actual development command.

---

# 4. Start the Application

Before starting the tunnel, make sure the simulation is running.

For a typical Vite project:

```bash
npm install
npm run dev
```

The terminal may report something similar to:

```text
Local:   http://localhost:5173/
```

Use the reported port.

Do not start a second copy of the development server if one is already running.

---

# 5. Start the Tunnel

Once the application is confirmed to work locally, start the tunnel.

Example:

```bash
cloudflared tunnel --url http://localhost:5173
```

The tunnel process must remain running.

Do not close the terminal/process hosting the tunnel.

---

# 6. Public URL

Extract the HTTPS URL from the tunnel process.

Example:

```text
https://example-name.trycloudflare.com
```

The remote tester should open this URL in a normal browser.

The final handoff should clearly report:

```text
Local application:
http://localhost:5173

Public tunnel:
https://<generated-url>
```

Do not invent a URL if the tunnel has not actually been started.

---

# 7. Verify Local Access First

Before exposing the application publicly, verify:

```text
http://localhost:<PORT>
```

loads successfully.

Check:

* Page loads
* Simulation renders
* Controls work
* Projectile launches
* Animation works
* Graphs render
* No critical console errors
* Assets load correctly

Only start the tunnel after local functionality is confirmed.

---

# 8. Verify Public Access

After starting the tunnel, test the generated public URL.

Verify:

```text
HTTPS connection works
        ↓
Application loads
        ↓
JavaScript bundles load
        ↓
CSS loads
        ↓
Simulation initializes
        ↓
Controls work
        ↓
Physics animation works
```

Pay particular attention to asset paths.

The application must not depend on:

```text
localhost
127.0.0.1
localhost:<PORT>
```

for browser-side resources.

A remote browser's `localhost` refers to the remote user's own computer, not the developer's computer.

---

# 9. Frontend Configuration

Search the project for hard-coded local URLs.

Look for:

```text
localhost
127.0.0.1
0.0.0.0
```

If any browser-side code uses them, determine whether they are actually necessary.

Prefer relative URLs:

```text
/api/...
```

instead of:

```text
http://localhost:5173/api/...
```

For a completely client-side physics simulation, there should ideally be no backend dependency at all.

---

# 10. Vite-Specific Considerations

If this is a Vite project, ensure the development server can accept requests forwarded through the tunnel.

The configuration may need to resemble:

```js
server: {
    host: "0.0.0.0",
    port: 5173
}
```

However, do not modify configuration unnecessarily.

Test the tunnel first.

If the tunnel can already reach the local service, preserve the existing project configuration.

---

# 11. WebSocket / Hot Reload

The development server may use WebSockets for hot module replacement.

A public tunnel can sometimes cause HMR warnings or reconnect attempts.

This is not necessarily a simulation failure.

The important requirement is:

```text
Public URL → application → physics simulation
```

If HMR causes problems through the tunnel, disable or ignore HMR for the remote demonstration rather than compromising the actual application.

For a demonstration, it is acceptable for the remote user to see the currently running version without live code updates.

---

# 12. Production Preview Option

If development mode causes problems, build the project first.

Example:

```bash
npm run build
```

Then run the project's preview server.

For Vite:

```bash
npm run preview
```

This commonly produces something like:

```text
http://localhost:4173
```

Then tunnel that port:

```bash
cloudflared tunnel --url http://localhost:4173
```

This is preferable for a stable demonstration because the remote user receives the production-built application rather than the development server.

---

# 13. Recommended Demonstration Workflow

Use this sequence:

```text
1. Install dependencies
        ↓
2. Start the application
        ↓
3. Open localhost
        ↓
4. Test the simulation
        ↓
5. Build production version if appropriate
        ↓
6. Start preview server
        ↓
7. Start HTTPS tunnel
        ↓
8. Copy generated public URL
        ↓
9. Open public URL independently
        ↓
10. Give URL to remote tester
```

---

# 14. Remote Tester Requirements

The remote tester should not need:

* Source code
* Node.js
* npm
* Python
* Git
* The project repository
* Router configuration
* VPN access

They should only need:

```text
A modern web browser
The public HTTPS URL
```

---

# 15. Security Requirements

This is intended for demonstration/testing.

Do not expose sensitive services through the tunnel.

The tunnel should expose **only the simulation's HTTP server**.

Do not tunnel:

```text
SSH
Database ports
Firebase Admin services
Operating-system services
File shares
Development dashboards
Credentials
```

Do not put passwords, API keys, Firebase Admin credentials, or other secrets in the frontend.

The tunnel URL should be treated as publicly accessible.

Anyone who obtains the URL may be able to access the simulation.

---

# 16. Temporary Access

The preferred setup is a temporary tunnel.

When the demonstration is finished:

```text
Stop tunnel
↓
Public URL stops working
```

Do not configure a permanent public domain unless explicitly requested.

The tunnel should not automatically start on system boot.

---

# 17. Troubleshooting

## Public URL does not load

Check:

```text
Is the local application running?
Is the port correct?
Is cloudflared running?
Is the tunnel pointing to the correct port?
```

Test:

```bash
curl http://localhost:<PORT>
```

Then inspect the tunnel terminal for connection errors.

---

## Page loads but simulation is blank

Check browser developer tools.

Look for:

```text
JavaScript errors
404 asset errors
CORS errors
Mixed-content errors
WebGL/canvas errors
```

If assets reference `localhost`, replace them with relative paths where appropriate.

---

## Page loads but buttons do not work

Check whether JavaScript bundles loaded successfully.

The remote browser must be able to retrieve every required:

```text
.js
.css
.json
.svg
.png
```

resource through the public hostname.

---

## Tunnel works locally but not remotely

Test the public URL from a different network.

Do not use the developer's own `localhost` to validate remote accessibility.

If possible, test from:

* Phone cellular data
* Another computer
* A different Wi-Fi network

---

# 18. Alternative Tunnel Providers

If `cloudflared` is unavailable, the agent may use an established HTTP tunneling provider already installed/configured in the environment.

Examples include:

```text
ngrok
LocalTunnel
Cloudflare Tunnel
```

The requirements remain the same:

```text
Public HTTPS URL
        ↓
Local HTTP server
```

Do not switch providers unnecessarily if the preferred tunnel is working.

---

# 19. Agent Behavior

The AI agent should:

1. Inspect the project.
2. Determine the framework.
3. Determine the correct start command.
4. Determine the actual local port.
5. Start the application if necessary.
6. Verify the application locally.
7. Start an HTTPS tunnel.
8. Verify the public URL.
9. Report the actual public URL.
10. Keep the tunnel process alive.

The agent must not claim that remote access works without actually testing the generated URL.

---

# 20. Final Output

After successful setup, provide a concise status report:

```text
AP Physics 1 Simulation
────────────────────────

Local:
http://localhost:<PORT>

Public:
https://<ACTUAL-TUNNEL-URL>

Status:
✓ Local server running
✓ HTTPS tunnel running
✓ Public URL verified

Remote user:
Open the Public URL in any modern browser.

Important:
The public URL remains available only while the local
application and tunnel processes are running.
```

The final URL must be the **actual URL generated by the tunnel**, not a placeholder.

---

# 21. Definition of Done

The task is complete only when a person on another network can open the public HTTPS URL and interact with the projectile-motion simulation.

Specifically:

* [ ] Application runs locally.
* [ ] Correct development/preview port identified.
* [ ] Local application verified.
* [ ] HTTPS tunnel established.
* [ ] Public URL generated.
* [ ] Public URL tested.
* [ ] JavaScript loads remotely.
* [ ] CSS/assets load remotely.
* [ ] Projectile simulation works remotely.
* [ ] Controls work remotely.
* [ ] Graphs work remotely.
* [ ] No sensitive service is exposed.
* [ ] Actual public URL is reported to the user.
* [ ] Tunnel can be stopped cleanly after the demonstration.
