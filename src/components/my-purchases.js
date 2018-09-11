import React, { Component } from 'react'
import { connect } from 'react-redux'
import { FormattedMessage } from 'react-intl'

import { storeWeb3Intent } from 'actions/App'
import MyPurchaseCard from 'components/my-purchase-card'
import { getListing } from 'utils/listing'
import { offerStatusToStep } from 'utils/offer'

import origin from '../services/origin'

class MyPurchases extends Component {
  constructor(props) {
    super(props)
    this.state = { filter: 'pending', purchases: [], loading: true }
  }

  componentDidMount() {
    if (!web3.givenProvider || !this.props.web3Account) {
      this.props.storeWeb3Intent('view your purchases')
    }
  }

  async componentWillMount() {
    const userAddress = await origin.contractService.currentAccount()
    const offerResp = await origin.discovery.query(`{
      user(walletAddress:${JSON.stringify(userAddress)}){
        offers{
          nodes{
            id,
            listing{
              id
            }
          }
        }
      }
    }`)
    const offerNodes = offerResp.data.user.offers.nodes
    const purchases = await Promise.all(offerNodes.map((node)=>{
      return new Promise(async resolve => {
        const offer = await origin.marketplace.getOffer(node.id)
        const listing = await getListing(node.listing.id)
        resolve({ offer, listing })
      })
    }))
    this.setState({ loading: false, purchases: purchases })
  }

  render() {
    const { filter, loading, purchases } = this.state
    const filteredPurchases = purchases.filter(obj => {
      const step = offerStatusToStep(obj.offer.status)
      if (filter === 'pending') {
        return step < 4
      } else if (filter === 'complete') {
        return step >= 4
      } else {
        return true
      }
    })

    return (
      <div className="my-purchases-wrapper">
        <div className="container">
          {loading && (
            <div className="row">
              <div className="col-12 text-center">
                <h1>
                  <FormattedMessage
                    id={'my-purchases.loading'}
                    defaultMessage={'Loading...'}
                  />
                </h1>
              </div>
            </div>
          )}
          {!loading &&
            !purchases.length && (
            <div className="row">
              <div className="col-12 text-center">
                <img src="images/empty-listings-graphic.svg" />
                <h1>
                  <FormattedMessage
                    id={'my-purchases.no-purchases'}
                    defaultMessage={'You haven’t bought anything yet.'}
                  />
                </h1>
                <p>
                  <FormattedMessage
                    id={'my-purchases.view-listings'}
                    defaultMessage={'Click below to view all listings.'}
                  />
                </p>
                <br />
                <a href="/" className="btn btn-lrg btn-primary">
                  <FormattedMessage
                    id={'my-purchases.browse-listings'}
                    defaultMessage={'Browse Listings'}
                  />
                </a>
              </div>
            </div>
          )}
          {!loading &&
            !!purchases.length && (
            <div className="row">
              <div className="col-12">
                <div className="row">
                  <div className="col-12">
                    <h1>
                      <FormattedMessage
                        id={'my-purchases.myPurchasesHeading'}
                        defaultMessage={'My Purchases'}
                      />
                    </h1>
                  </div>
                </div>
                <div className="row">
                  <div className="col-12 col-md-3">
                    <div className="filters list-group flex-row flex-md-column">
                      <a
                        className={`list-group-item list-group-item-action${
                          filter === 'pending' ? ' active' : ''
                        }`}
                        onClick={() => this.setState({ filter: 'pending' })}
                      >
                        <FormattedMessage
                          id={'my-purchases.pending'}
                          defaultMessage={'Pending'}
                        />
                      </a>
                      <a
                        className={`list-group-item list-group-item-action${
                          filter === 'complete' ? ' active' : ''
                        }`}
                        onClick={() => this.setState({ filter: 'complete' })}
                      >
                        <FormattedMessage
                          id={'my-purchases.complete'}
                          defaultMessage={'Complete'}
                        />
                      </a>
                      <a
                        className={`list-group-item list-group-item-action${
                          filter === 'all' ? ' active' : ''
                        }`}
                        onClick={() => this.setState({ filter: 'all' })}
                      >
                        <FormattedMessage
                          id={'my-purchases.all'}
                          defaultMessage={'All'}
                        />
                      </a>
                    </div>
                  </div>
                  <div className="col-12 col-md-9">
                    <div className="my-listings-list">
                      {filteredPurchases.map(p => (
                        <MyPurchaseCard
                          key={p.offer.id}
                          offerId={p.offer.id}
                          offer={p.offer}
                          listing={p.listing}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
}

const mapStateToProps = state => {
  return {
    web3Account: state.app.web3.account,
    web3Intent: state.app.web3.intent
  }
}

const mapDispatchToProps = dispatch => ({
  storeWeb3Intent: intent => dispatch(storeWeb3Intent(intent))
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MyPurchases)
