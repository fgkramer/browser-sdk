import { buildConfiguration } from '../src/configuration'

describe('configuration', () => {
  const clientToken = 'some_client_token'
  const prodEnv = {
    buildMode: 'release' as 'release',
    datacenter: 'us' as 'us',
    env: 'production' as 'production',
    sdkVersion: 'some_version',
  }

  describe('internal monitoring endpoint', () => {
    it('should only be defined when api key is provided', () => {
      let configuration = buildConfiguration({ clientToken }, prodEnv)
      expect(configuration.internalMonitoringEndpoint).toBeUndefined()

      configuration = buildConfiguration({ clientToken, internalMonitoringApiKey: clientToken }, prodEnv)
      expect(configuration.internalMonitoringEndpoint).toContain(clientToken)
    })
  })

  describe('endpoint overload', () => {
    it('should not be available for production env', () => {
      const endpoint = 'bbbbbbbbbbbbbbb'
      const configuration = buildConfiguration(
        { clientToken, rumEndpoint: endpoint, logsEndpoint: endpoint, internalMonitoringEndpoint: endpoint },
        prodEnv
      )
      expect(configuration.rumEndpoint).not.toEqual(endpoint)
      expect(configuration.logsEndpoint).not.toEqual(endpoint)
      expect(configuration.internalMonitoringEndpoint).not.toEqual(endpoint)
    })

    it('should be available for e2e-test build mode', () => {
      const endpoint = 'bbbbbbbbbbbbbbb'
      const e2eEnv = {
        buildMode: 'e2e-test' as 'e2e-test',
        datacenter: 'us' as 'us',
        env: 'staging' as 'staging',
        sdkVersion: 'some_version',
      }
      const configuration = buildConfiguration(
        { clientToken, rumEndpoint: endpoint, logsEndpoint: endpoint, internalMonitoringEndpoint: endpoint },
        e2eEnv
      )
      expect(configuration.rumEndpoint).toEqual(endpoint)
      expect(configuration.logsEndpoint).toEqual(endpoint)
      expect(configuration.internalMonitoringEndpoint).toEqual(endpoint)
    })
  })

  describe('isCollectingError', () => {
    it('should be enabled by default', () => {
      const configuration = buildConfiguration({ clientToken }, prodEnv)
      expect(configuration.isCollectingError).toEqual(true)
    })

    it('should be disabled when defined to false', () => {
      const configuration = buildConfiguration({ clientToken, isCollectingError: false }, prodEnv)
      expect(configuration.isCollectingError).toEqual(false)
    })
  })

  describe('datacenter', () => {
    it('should use buildEnv value by default', () => {
      const configuration = buildConfiguration({ clientToken }, prodEnv)
      expect(configuration.rumEndpoint).toContain('datadoghq.com')
    })

    it('should use user value when set', () => {
      const configuration = buildConfiguration({ clientToken, datacenter: 'eu' }, prodEnv)
      expect(configuration.rumEndpoint).toContain('datadoghq.eu')
    })
  })

  describe('proxyHost', () => {
    it('should replace endpoint host add set it as a query parameter', () => {
      const configuration = buildConfiguration({ clientToken, proxyHost: 'proxy.io' }, prodEnv)
      expect(configuration.rumEndpoint).toMatch(/^https:\/\/proxy\.io\//)
      expect(configuration.rumEndpoint).toContain('?ddhost=rum-http-intake.logs.datadoghq.com&')
    })
  })
})
