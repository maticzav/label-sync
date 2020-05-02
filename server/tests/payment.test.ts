import moment from 'moment'
import { Payments } from '../src/payment'

describe('payments:', () => {
  let payments: Payments

  beforeAll(() => {
    payments = new Payments('key', 'secret')
  })

  test('sets right expiration date:', () => {
    expect(
      moment(payments.getExpirationDateFromNow('ANNUALLY')).diff(
        moment(),
        'day',
      ),
    ).toBe(364)
    expect(
      moment(payments.getExpirationDateFromNow('MONTHLY')).diff(
        moment(),
        'day',
      ),
    ).toBe(31)
  })
})
