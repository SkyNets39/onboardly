$body = @{
    query = "berapa hari cuti tahunan?"
    company_id = "060d9407-1746-4f6c-aafe-02d5f3e88891"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Uri "https://zbsymtyiuylfytztvyec.supabase.co/functions/v1/chat" `
        -Method POST `
        -Headers @{
            "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic3ltdHlpdXlsZnl0enR2eWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNTk3MDYsImV4cCI6MjA5MTYzNTcwNn0.2fWIhS470Dxp0D6QohTMyJVKalHKaeBafsgsky4AHSI"
            "Content-Type" = "application/json"
        } `
        -Body $body

    $response | ConvertTo-Json -Depth 5
} catch {
    $err = $_.Exception.Response
    $stream = $err.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $reader.BaseStream.Position = 0
    $body = $reader.ReadToEnd()
    Write-Host "Error detail: $body"
}