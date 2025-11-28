<#
.SYNOPSIS
  Inicia a aplicação Microplan em modo CLI (headless) usando o mvnw.

.DESCRIPTION
  Script de conveniência para desenvolvimento. Define a variável de ambiente
  SPRING_APPLICATION_JSON para ativar o CLI (`app.cli.enabled=true`) e opcionalmente
  remove o servidor web (`spring.main.web-application-type=none`).

.PARAMETER Port
  Porta HTTP que a aplicação deve usar (padrão: 9090).

.PARAMETER KeepWeb
  Se fornecido, não define `web-application-type=none` — mantém o servidor web ativo.

EXAMPLE
  .\run-cli.ps1
  Inicia na porta 9090 em modo CLI-only.

  .\run-cli.ps1 -Port 8080 -KeepWeb
  Inicia na porta 8080 com servidor web ativo e CLI habilitado.
#>

param(
    [int]$Port = 9090,
    [switch]$KeepWeb
)

$ErrorActionPreference = 'Stop'

# Move para o diretório do repositório (assume que o script é executado da raiz do projeto)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptDir

try {
    Write-Host "Iniciando Microplan em modo CLI na porta $Port..."

    if ($KeepWeb) {
        $json = '{"server":{"port":' + $Port + '},"app":{"cli":{"enabled":true}}}'
    }
    else {
        $json = '{"server":{"port":' + $Port + '},"app":{"cli":{"enabled":true}},"spring":{"main":{"web-application-type":"none"}}}'
    }

    $env:SPRING_APPLICATION_JSON = $json

    # Ativa automaticamente o profile 'dev' para habilitar o CLI durante o run-script
    $env:SPRING_PROFILES_ACTIVE = 'dev'

    if (Test-Path .\mvnw.cmd) {
        & .\mvnw.cmd -DskipTests=true spring-boot:run
    }
    elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
        mvn -DskipTests=true spring-boot:run
    }
    else {
        Write-Error "Nenhum wrapper Maven (.\mvnw.cmd) encontrado e 'mvn' não está no PATH."
        exit 1
    }
}
finally {
    Pop-Location
}
