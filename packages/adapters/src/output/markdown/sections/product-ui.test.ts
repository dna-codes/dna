import { render } from '../index'
import type { ProductUiDna } from '../types'

const ui: ProductUiDna = {
  layout: { name: 'Shell', type: 'full-width' },
  workflows: [
    { name: 'Checkout', resource: 'Order', pages: ['CartReview', 'Payment'] },
  ],
  pages: [
    {
      name: 'CartReview',
      resource: 'Cart',
      sections: [
        {
          name: 'Main',
          role: 'main',
          components: [
            {
              name: 'CartTable',
              type: 'table',
              operation: 'Cart.List',
              elements: [{ name: 'QuantityInput', type: 'input', field: 'quantity' }],
            },
          ],
        },
      ],
    },
  ],
  operations: [
    {
      id: 'submit-payment',
      name: 'SubmitPayment',
      trigger: { component: 'PayButton', event: 'click' },
      effects: [
        { type: 'api-call', operation: 'Order.Pay' },
        { type: 'navigate', to: 'OrderConfirmation' },
      ],
    },
  ],
}

describe('markdown — product-ui section', () => {
  const md = render({ productUi: ui }, { sections: ['product-ui'], title: 'Store' })

  it('renders a Product UI heading', () => {
    expect(md).toContain('## Product UI')
  })

  it('renders workflows with their page journey', () => {
    expect(md).toContain('**Checkout**')
    expect(md).toContain('CartReview → Payment')
  })

  it('renders the Page → Section → Component → Element hierarchy', () => {
    expect(md).toContain('#### CartReview')
    expect(md).toContain('**Main**')
    expect(md).toContain('CartTable')
    expect(md).toContain('QuantityInput')
  })

  it('renders UI operations with trigger and effects', () => {
    expect(md).toContain('**SubmitPayment** `on PayButton.click`')
    expect(md).toContain('call Order.Pay')
    expect(md).toContain('navigate → OrderConfirmation')
  })

  it('renders nothing when productUi is absent', () => {
    const empty = render({ productUi: undefined }, { sections: ['product-ui'] })
    expect(empty).toBe('')
  })
})
