import { Period } from '@prisma/client'
import moment from 'moment'

import { Payments } from '../src/payment'

describe('payments:', () => {
  let payments: Payments

  beforeAll(() => {
    payments = new Payments('key', 'secret')
  })

  test('sets right expiration date:', () => {
    expect(
      366 -
        moment(payments.getExpirationDateFromNow('ANNUALLY')).diff(
          moment(),
          'day',
        ),
    ).toBeLessThan(3)
    expect(
      31 -
        moment(payments.getExpirationDateFromNow('MONTHLY')).diff(
          moment(),
          'day',
        ),
    ).toBeLessThan(3)
  })

  test('active plans:', () => {
    const plans: Period[] = ['MONTHLY', 'ANNUALLY']
    expect(plans.map(payments.getPlanForPeriod)).toMatchSnapshot()
  })
})
