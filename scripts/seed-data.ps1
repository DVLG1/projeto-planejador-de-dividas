Write-Host "MicroPlan seed script: posting sample data to http://localhost:9090"

# Use same base as the application port. Updated to 9090 by default.
$base = 'http://localhost:9090'

Write-Host "Waiting for API to become available..."
for ($i=0; $i -lt 30; $i++) {
    try {
        Invoke-RestMethod -Uri "$base/api/usuarios" -Method Get -ErrorAction Stop | Out-Null
        Write-Host "API reachable"
        break
    } catch {
        Write-Host "Waiting for server... ($($i+1)/30)"
        Start-Sleep -Seconds 2
    }
}

try {
    # create or reuse usuario (idempotent)
    $targetEmail = 'testuser@example.local'
    $usuarios = Invoke-RestMethod -Uri "$base/api/usuarios" -Method Get -ErrorAction SilentlyContinue
    $usuarioRes = $null
    if ($usuarios) { $usuarioRes = $usuarios | Where-Object { $_.email -eq $targetEmail } }
    if (-not $usuarioRes) {
        $usuarioPayload = @{ nome = 'Test User'; email = $targetEmail; rendaMensal = 3000.00 } | ConvertTo-Json
        $usuarioRes = Invoke-RestMethod -Uri "$base/api/usuarios" -Method Post -ContentType 'application/json' -Body $usuarioPayload
        Write-Host "Created usuario id=$($usuarioRes.id)"
    } else {
        Write-Host "Found existing usuario id=$($usuarioRes.id) email=$($usuarioRes.email)"
    }

    # create or reuse credor (idempotent)
    $targetCredor = 'Banco Exemplo'
    $credores = Invoke-RestMethod -Uri "$base/api/credores" -Method Get -ErrorAction SilentlyContinue
    $credorRes = $null
    if ($credores) { $credorRes = $credores | Where-Object { $_.nome -eq $targetCredor } }
    if (-not $credorRes) {
        $credorPayload = @{ nome = $targetCredor; contato = 'contato@banco.local' } | ConvertTo-Json
        $credorRes = Invoke-RestMethod -Uri "$base/api/credores" -Method Post -ContentType 'application/json' -Body $credorPayload
        Write-Host "Created credor id=$($credorRes.id)"
    } else {
        Write-Host "Found existing credor id=$($credorRes.id) nome=$($credorRes.nome)"
    }

    $dividaObj = @{
        usuario = @{ id = $usuarioRes.id }
        credor = @{ id = $credorRes.id }
        descricao = 'Cartão Teste'
        saldoAtual = 1500.00
        taxaJurosAnual = 12.5
        parcelaMinima = 50.00
        vencimentoMensal = 10
    }
    $dividaPayload = $dividaObj | ConvertTo-Json -Depth 5
    $dividaRes = Invoke-RestMethod -Uri "$base/api/dividas" -Method Post -ContentType 'application/json' -Body $dividaPayload
    Write-Host "Created divida id=$($dividaRes.id)"

    $planPayload = @{ usuarioId = $usuarioRes.id; valorDisponivelMensal = 600.00; estrategia = 'AVALANCHE' } | ConvertTo-Json
    $planRes = Invoke-RestMethod -Uri "$base/api/planos/generate" -Method Post -ContentType 'application/json' -Body $planPayload
    Write-Host "Generated plan id=$($planRes.id) duration months=$($planRes.duracaoEstimadaMeses)"

    $dividas = Invoke-RestMethod -Uri "$base/api/dividas/usuario/$($usuarioRes.id)" -Method Get
    Write-Host "Dividas for user (fetched via API):"
    $dividas | ConvertTo-Json

    Write-Host "Seed script completed successfully"
} catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    exit 1
}
