import React, { Component, Fragment } from 'react';
import classNames from 'classnames';
import { Col, Row, Spinner } from 'react-bootstrap';

import { Event, Pagination } from '../components';
import { arrayChunk, descPagination, handleError, toEvent } from '../utils';

const CHUNK = 3;

class MyTickets extends Component {
  state = {
    loaded: false,
    page: 1,
    paginationHasPrev: false,
    paginationHasNext: false,
    perPage: 12,
    tickets: [],
    totalTickets: 0
  };

  componentDidMount = async () => {
    if (this.props.initialized) {
      await this.getTickets();
    }
  };

  componentDidUpdate = async (prevProps) => {
    if (
      this.props.initialized &&
      this.props.initialized !== prevProps.initialized
    ) {
      await this.getTickets();
    }
  };

  getTickets = async (page = 1) => {
    try {
      this.setState({ loaded: false, tickets: [] });

      const { accounts, loketh } = this.props;

      const [account] = accounts;

      const ticketIds = await loketh.methods.ticketsOfOwner(account).call({
        from: account
      });

      const totalTickets = ticketIds.length;

      this.setState({ page, totalTickets }, async () => {
        const { page, perPage, totalTickets } = this.state;

        const {
          maxId,
          minId,
          hasPrev: paginationHasPrev,
          hasNext: paginationHasNext
        } = descPagination(totalTickets, page, perPage);

        console.log({ maxId, minId });

        const tickets = [];

        for (let i = maxId; i > minId; i--) {
          const id = ticketIds[i];

          const event = await loketh.methods.getEvent(id).call({
            from: account
          });

          tickets.push(toEvent(event, id));
        }

        this.setState({
          loaded: true,
          paginationHasPrev,
          paginationHasNext,
          tickets: arrayChunk(tickets, CHUNK)
        });
      });
    } catch (error) {
      handleError(error);
    }
  };

  render() {
    const {
      loaded,
      page,
      paginationHasPrev,
      paginationHasNext,
      perPage,
      tickets,
      totalTickets
    } = this.state;

    const fromData = ((page - 1) * perPage) + 1;
    const toData = paginationHasNext ? page * perPage : totalTickets;

    return (
      <Fragment>
        <h1>My Tickets</h1>
        {
          loaded ? (
            tickets.length > 0 ? (tickets.map((chunk, i) => {
              const filler = [];

              for (let x = 0; x < (CHUNK - chunk.length); x++) {
                filler.push(<Col key={x} />);
              }

              // eslint-disable-next-line
              const rowClassName = classNames({ ['mt-4']: i > 0 });

              return (
                <Row className={rowClassName} key={i}>
                  {chunk.map((ticket, j) => (
                    <Col key={j}>
                      <Event event={ticket} forParticipant />
                    </Col>
                  ))}
                  {filler}
                </Row>
              );
            })) : (
              <p className="text-center">
                You have no tickets at this time.
              </p>
            )
          ) : (
            <div className="d-flex justify-content-center">
              <Spinner animation="border" />
            </div>
          )
        }
        {
          tickets.length > 0 && (
            <Pagination
              from={fromData}
              hasPrev={paginationHasPrev}
              hasNext={paginationHasNext}
              onClickPrev={() => {
                this.getTickets(page - 1);
              }}
              onClickNext={() => {
                this.getTickets(page + 1);
              }}
              to={toData}
              total={totalTickets}
            />
          )
        }
      </Fragment>
    );
  }
}

export default MyTickets;