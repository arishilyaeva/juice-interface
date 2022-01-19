import { Form, Modal, Space } from 'antd'
import FormattedAddress from 'components/shared/FormattedAddress'
import InputAccessoryButton from 'components/shared/InputAccessoryButton'
import FormattedNumberInput from 'components/shared/inputs/FormattedNumberInput'
import { NetworkContext } from 'contexts/networkContext'
import { ProjectContext } from 'contexts/projectContext'
import { ThemeContext } from 'contexts/themeContext'
import { constants } from 'ethers'
import useUnclaimedBalanceOfUser from 'hooks/contractReader/UnclaimedBalanceOfUser'
import { useUnstakeTokensTx } from 'hooks/transactor/UnstakeTokensTx'
import { useContext, useLayoutEffect, useState } from 'react'
import { formatWad, fromWad, parseWad } from 'utils/formatNumber'

export default function ConfirmUnstakeTokensModal({
  visible,
  onCancel,
}: {
  visible?: boolean
  onCancel?: VoidFunction
}) {
  const [loading, setLoading] = useState<boolean>()
  const [unstakeAmount, setUnstakeAmount] = useState<string>()
  const { userAddress } = useContext(NetworkContext)
  const {
    theme: { colors },
  } = useContext(ThemeContext)
  const { tokenSymbol, tokenAddress, projectId, terminal } =
    useContext(ProjectContext)
  const unstakeTokensTx = useUnstakeTokensTx()

  const iouBalance = useUnclaimedBalanceOfUser(
    userAddress,
    projectId,
    terminal?.name,
  )

  useLayoutEffect(() => {
    setUnstakeAmount(fromWad(iouBalance))
  }, [iouBalance])

  function unstake() {
    if (
      !unstakeAmount ||
      parseWad(unstakeAmount).eq(0) // Disable claiming 0 tokens
    )
      return

    setLoading(true)

    unstakeTokensTx(
      { unstakeAmount: parseWad(unstakeAmount) },
      {
        onDone: () => setLoading(false),
        onConfirmed: onCancel ? () => onCancel() : undefined,
      },
    )
  }

  const ticketsIssued = tokenAddress
    ? tokenAddress !== constants.AddressZero
    : false

  return (
    <Modal
      title={`Claim ${tokenSymbol ?? 'tokens'} as ERC20 tokens`}
      visible={visible}
      onOk={unstake}
      okText={`Claim ${unstakeAmount} ERC20 tokens`}
      confirmLoading={loading}
      okButtonProps={{ disabled: parseWad(unstakeAmount).eq(0) }}
      onCancel={onCancel}
      width={600}
      centered
    >
      <Space direction="vertical" size="large">
        {!ticketsIssued && (
          <div style={{ padding: 10, background: colors.background.l1 }}>
            <b>Note:</b> Tokens cannot be claimed because no ERC20 token has
            been issued for this project. ERC20 tokens must be issued by the
            project owner.
          </div>
        )}

        <div>
          <p>
            Claiming {tokenSymbol} tokens will convert your {tokenSymbol}{' '}
            balance to ERC20 tokens and mint them to your wallet.
          </p>
          <p style={{ fontWeight: 600 }}>
            If you're unsure if you need to claim, you probably don't.
          </p>
          <p>
            You can still redeem your {tokenSymbol} tokens for overflow without
            claiming them, and you can transfer your unclaimed {tokenSymbol}{' '}
            tokens to another address from the Tools menu, which can be accessed
            from the wrench icon in the upper right hand corner of this project.
          </p>
        </div>

        <div>
          <div>
            <label>Your unclaimed {tokenSymbol} tokens:</label>{' '}
            {formatWad(iouBalance, { precision: 8 })}
          </div>
          {ticketsIssued && (
            <div>
              <label>{tokenSymbol} ERC20 address:</label>{' '}
              <FormattedAddress address={tokenAddress} />
            </div>
          )}
        </div>

        <Form layout="vertical">
          <Form.Item label="Amount of ERC20 tokens to claim">
            <FormattedNumberInput
              min={0}
              max={parseFloat(fromWad(iouBalance))}
              disabled={!ticketsIssued}
              placeholder="0"
              value={unstakeAmount}
              accessory={
                <InputAccessoryButton
                  content="MAX"
                  onClick={() => setUnstakeAmount(fromWad(iouBalance))}
                />
              }
              onChange={val => setUnstakeAmount(val)}
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  )
}
