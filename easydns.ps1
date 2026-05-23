powershell# Definir variables
$easydnsUser = "drcarloni"
$easydnsToken = "B955836592C861E9"
$domain = "drsrv.net.ar"

# Ejecutar la actualización de easyDNS
$url = "https://$easydnsUser:$easydnsToken@://easydns.com"
$response = Invoke-RestMethod -Uri $url -Method Get
Write-Output $response
