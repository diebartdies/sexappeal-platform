# SexAppeal Platform - Technical Documentation

This project is a complete, production-ready API platform for the SexAppeal service, featuring an Express.js backend, MongoDB database, Nginx API Gateway, and automated SSL/Deployment.

## 🚀 How to Access the Web Server

### 1. Local Development (Testing)
To run the entire stack on your local machine:

1.  **Start the containers:**
    ```bash
    docker-compose up --build
    ```
2.  **Access the API:**
    *   **Main API:** `http://localhost` (Nginx will route this to the Express app)
    *   **Health Check:** `http://localhost/health`
    *   **Direct App Access:** `http://localhost:5000`

> **Note:** Since the SSL configuration is set for `sexappeal.drsrv.net.ar`, your browser will show a security warning for `localhost`. You can bypass this or use HTTP for local testing.

### 2. Production Access & External Setup
Once deployed to your server:
*   **Domain:** `https://sexappeal.drsrv.net.ar`
*   **Health Status:** `https://sexappeal.drsrv.net.ar/health`

**Steps for External Visibility:**
1.  **Port Forwarding:** Forward ports **80** and **443** on your router to the IP address of this machine.
2.  **SSL Certificates:** Nginx reads `fullchain.pem` and `privkey.pem` from:
    `certbot/conf/live/sexappeal.drsrv.net.ar/`

    After renewing Let's Encrypt files (`sexappeal.cer`, `sexappeal.chain`, `sexappeal.key`), sync them into the nginx filenames:

    ```powershell
    powershell -File scripts\sync-ssl-certs.ps1
    ```

    `upload_to_server.bat` runs this automatically before each deploy.
3.  **Start Platform:**
    ```bash
    docker-compose up --build -d
    ```

---

## 🛠 Project Architecture

*   **API Gateway (Nginx):** Handles SSL, Rate Limiting (10 req/s), and Security Headers.
*   **App Server (Express):** Handles logic, authentication (JWT), and business rules.
*   **Database (MongoDB):** Persistent storage using Docker volumes.
*   **SSL (Certbot):** Automatic Let's Encrypt certificate management.
*   **Deployment (Ansible):** One-command server setup and hardening.

---

## 📂 API Endpoints Summary

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| POST | `/api/v1/auth/register` | Register new user/professional | Public |
| POST | `/api/v1/auth/login` | Login and receive JWT Cookie | Public |
| GET | `/api/v1/professionals` | List verified professionals | Public |
| GET | `/api/v1/professionals/:alias` | View professional profile | Public |
| PUT | `/api/v1/professionals/updateprofile` | Update own profile | Private (Professional) |
| POST | `/api/v1/feedback` | Submit feedback (Respect Filter) | Private (User) |
| GET | `/api/v1/admin/verifications/pending` | List profiles needing verification | Private (Admin) |

---

## 🚢 Deployment Instructions (Ansible)

1.  **Update Inventory:** Edit `ansible/inventory.ini` with your server IP.
2.  **Push Code:** Ensure your code is on GitHub and the URL is updated in `ansible/deploy.yml`.
3.  **Deploy:**
    ```bash
    cd ansible
    ansible-playbook -i inventory.ini deploy.yml
    ```

## 🔒 Security Features
*   **Rate Limiting:** Nginx restricts requests per IP to prevent DDoS.
*   **Respect Agreement:** API filters feedback for inappropriate terms and reports violations to `admin@drsrv.net.ar`.
*   **Firewall:** Ansible configures UFW to block all ports except 22, 80, and 443.
*   **JWT:** Secure authentication using HTTP-only cookies.
