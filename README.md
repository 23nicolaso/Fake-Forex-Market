# Fake Forex Market

Welcome to the Fake Forex Market project! This project simulates a currency exchange platform with random orders, market maker orders, and various statistical analyses. The platform is built using HTML, CSS, and JavaScript, and it leverages the Chart.js library for visualizing price data.

## Features

- **Buy and Sell Orders**: Users can place buy and sell orders with either limit or market order types.
- **Market Maker**: The market maker places orders to maintain liquidity and balance the order book.
- **Random Orders**: Random orders are generated to simulate market activity.
- **Price History**: A line chart visualizes the last price over time.
- **Order Book Skew**: Displays the difference between total buy and sell orders.
- **Market Maker Exposure**: Shows the net exposure of the market maker.
- **Price Histogram**: Visualizes the distribution of buy and sell orders.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, etc.)

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/simulated-forex-market.git
    ```
2. Navigate to the project directory:
    ```sh
    cd simulated-forex-market
    ```

### Usage

1. Open the `market.html` file in your web browser.
2. Interact with the platform by placing buy and sell orders.
3. Observe the market dynamics through the various charts and statistics.

## Project Structure

- `market.html`: The main HTML file containing the structure and logic of the simulated market.
- `styles.css`: Contains the CSS styles for the platform.
- `scripts.js`: Contains the JavaScript code for handling orders, market maker logic, and chart updates.

## Key Functions

- **addCustomOrder(orderType, orderType2)**: Adds a custom order based on user input.
- **addRandomOrder()**: Generates and adds a random order to the order book.
- **marketMakerOrders()**: Generates market maker orders to maintain liquidity.
- **updateOrderBookSkew()**: Updates the order book skew based on the current orders.
- **updateMarketMakerExposure()**: Updates the market maker's net exposure.
- **updateLineChart()**: Updates the line chart with the latest price data.
- **updateHistogram(elementId, orders)**: Updates the histogram with the latest order data.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your changes.

## License

This project is licensed under the MIT License. See the license file for details.

## Acknowledgements

- [Chart.js](https://www.chartjs.org/) for the charting library.
- [GitHub](https://github.com/) for hosting the repository.

## Contact

For any questions or feedback, please contact [23nicolaso@gmail.com](mailto:23nicolaso@gmail.com).
