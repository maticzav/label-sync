import * as inquirer from 'inquirer'
import * as fs from 'fs'
import * as path from 'path'
import * as mkdirp from 'mkdirp'
import * as creato from 'creato'

import { main } from '../src/'

describe('bin', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('returns on existing directory', async () => {
    const dist = path.resolve(__dirname, 'folder')

    /**
     * Mocks
     */
    const inquirerPromptMock = jest
      .spyOn(inquirer, 'prompt')
      .mockResolvedValueOnce({ template: 'template' })
      .mockResolvedValueOnce({ dist: dist })
    const fsExistsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    const fsMkdirSync = jest.spyOn(mkdirp, 'sync')
    const consoleLogMock = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {})
    const loadTemplateMock = jest.spyOn(creato, 'loadTemplate')

    /**
     * Execution
     */

    await main({} as any)

    /**
     * Tests
     */

    expect(inquirerPromptMock).toHaveBeenCalledTimes(2)
    expect(fsExistsSyncMock).toHaveBeenCalledTimes(1)
    expect(fsMkdirSync).toHaveBeenCalledTimes(0)
    expect(consoleLogMock).toHaveBeenCalledTimes(1)
    expect(loadTemplateMock).toHaveBeenCalledTimes(0)
    expect(consoleLogMock).toHaveBeenCalledWith(
      `Directory ${dist} must be empty.`,
    )
  })

  test('logs success on success', async () => {
    const dist = path.resolve(__dirname, 'folder')

    /**
     * Mocks
     */
    const inquirerPromptMock = jest
      .spyOn(inquirer, 'prompt')
      .mockResolvedValueOnce({ template: 'template' })
      .mockResolvedValueOnce({ dist: dist })
    const fsExistsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    const fsMkdirSync = jest.spyOn(mkdirp, 'sync').mockImplementation(() => '')
    const consoleLogMock = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {})
    const loadTemplateMock = jest
      .spyOn(creato, 'loadTemplate')
      .mockResolvedValue({ status: 'ok', message: 'pass' })

    /**
     * Execution
     */

    await main({} as any)

    /**
     * Tests
     */

    expect(inquirerPromptMock).toHaveBeenCalledTimes(2)
    expect(fsExistsSyncMock).toHaveBeenCalledTimes(1)
    expect(fsMkdirSync).toHaveBeenCalledTimes(1)
    expect(consoleLogMock).toHaveBeenCalledTimes(1)
    expect(loadTemplateMock).toHaveBeenCalledTimes(1)
    expect(consoleLogMock).toHaveBeenCalledWith('pass')
  })

  test('warns error on error', async () => {
    const dist = path.resolve(__dirname, 'folder')

    /**
     * Mocks
     */
    const inquirerPromptMock = jest
      .spyOn(inquirer, 'prompt')
      .mockResolvedValueOnce({ template: 'template' })
      .mockResolvedValueOnce({ dist: dist })
    const fsExistsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(false)
    const fsMkdirSync = jest.spyOn(mkdirp, 'sync').mockImplementation(() => '')
    const consoleLogMock = jest
      .spyOn(console, 'log')
      .mockImplementation(() => {})
    const consoleWarnMock = jest
      .spyOn(console, 'warn')
      .mockImplementation(() => {})
    const loadTemplateMock = jest
      .spyOn(creato, 'loadTemplate')
      .mockResolvedValue({ status: 'err', message: 'pass' })

    /**
     * Execution
     */

    await main({} as any)

    /**
     * Tests
     */

    expect(inquirerPromptMock).toHaveBeenCalledTimes(2)
    expect(fsExistsSyncMock).toHaveBeenCalledTimes(1)
    expect(fsMkdirSync).toHaveBeenCalledTimes(1)
    expect(consoleLogMock).toHaveBeenCalledTimes(0)
    expect(consoleWarnMock).toHaveBeenCalledTimes(1)
    expect(loadTemplateMock).toHaveBeenCalledTimes(1)
    expect(consoleWarnMock).toHaveBeenCalledWith('pass')
  })
})
