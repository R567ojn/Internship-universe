$urls = @(
    @{id='R01'; url='https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=900&q=60'},
    @{id='R18'; url='https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=900&q=60'},
    @{id='R19'; url='https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&w=900&q=60'},
    @{id='R27'; url='https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=60'}
)

Write-Host "Testing 4 sample URLs (R01, R18, R19, R27)..."
foreach ($item in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $item.url -Method Head -UseBasicParsing -TimeoutSec 10
        $ct = $response.Headers['Content-Type']
        Write-Host "$($item.id): OK ($($response.StatusCode) - $ct)"
    } catch {
        Write-Host "$($item.id): FAILED"
    }
}
