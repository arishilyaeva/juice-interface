import { ProjectContext } from 'contexts/projectContext'
import { UserContext } from 'contexts/userContext'
import { BigNumber, Contract } from 'ethers'
import { CurrencyOption } from 'models/currency-option'
import { useContext } from 'react'
import { parseWad } from 'utils/formatNumber'

import { TransactorInstance } from './Transactor'

export function usePrintTokensTx(): TransactorInstance<{
  value: BigNumber
  currency: CurrencyOption
  beneficiary: string
  memo: string
  preferUnstaked: boolean
}> {
  const { transactor, contracts } = useContext(UserContext)
  const { terminal, projectId } = useContext(ProjectContext)

  return ({ value, currency, beneficiary, memo, preferUnstaked }, txOpts) => {
    if (!transactor || !contracts || !projectId || !terminal?.version) {
      if (txOpts?.onDone) txOpts.onDone()
      return Promise.resolve(false)
    }

    let terminalContract: Contract
    let functionName: string
    let args: any[]

    switch (terminal.version) {
      case '1':
        terminalContract = contracts.TerminalV1
        functionName = 'printPreminedTickets'
        args = [
          projectId.toHexString(),
          parseWad(value).toHexString(),
          BigNumber.from(currency).toHexString(),
          beneficiary,
          memo,
          preferUnstaked,
        ]
        break
      case '1.1':
        terminalContract = contracts.TerminalV1_1
        functionName = 'printTickets'
        args = [
          projectId.toHexString(),
          parseWad(value).toHexString(),
          beneficiary,
          memo,
          preferUnstaked,
        ]
    }

    return transactor(terminalContract, functionName, args, txOpts)
  }
}
