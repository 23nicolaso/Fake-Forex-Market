let buyOrders = [];
let sellOrders = [];
let lastPrice = 50.0; // Initialize lastPrice with a default value
let priceHistory = []; // Array to store price history
let chart; // Variable to store the chart instance
let probability = 0.6;
let marketMakerBuyOrdersFilled = 0; // Track filled market maker buy orders
let marketMakerSellOrdersFilled = 0; // Track filled market maker sell orders
let orderBookSkew = 0;
let aboveMovingAverage = true;
let acceleration = 0.0;

document.addEventListener('DOMContentLoaded', function() {
    createLineChart();
    setInterval(addRandomOrder, 100); 
    setInterval(updateLineChart, 150);
    setInterval(updateOrderBookSkew, 15);
    setInterval(marketMakerOrders, 100);
    setInterval(updateMarketMakerExposure, 100); // Update the market maker exposure every second
    setInterval(generateMarketOrder, 300);
});

function updateMarketMakerExposure() {
    const exposure = marketMakerBuyOrdersFilled - marketMakerSellOrdersFilled;
    document.getElementById('marketMakerExposure').innerText = exposure;
}

function updateOrderBookSkew() {
    let totalBuyAmount = buyOrders.reduce((acc, order) => acc + (order.amount || 0), 0);
    let totalSellAmount = sellOrders.reduce((acc, order) => acc + (order.amount || 0), 0);
    const skew = totalBuyAmount - totalSellAmount;
    orderBookSkew = skew; 
    document.getElementById('orderBookSkew').innerText = skew.toString();

    // calculate other stats
    if (priceHistory.length >= 30) {
        const lastThirtyPrices = priceHistory.slice(-30);
        const movingAverage = lastThirtyPrices.reduce((acc, curr) => acc + curr, 0) / 30;
        // Check if the last price is above the moving average
        if (lastPrice > movingAverage) {
            aboveMovingAverage = true;
        } else {
            aboveMovingAverage = false;
        }
    }

    if (priceHistory.length >= 3) {
        const latestPrice = priceHistory[priceHistory.length - 1];
        const secondLatestPrice = priceHistory[priceHistory.length - 2];
        const thirdLatestPrice = priceHistory[priceHistory.length - 3];

        const firstVelocity = latestPrice - secondLatestPrice;
        const secondVelocity = secondLatestPrice - thirdLatestPrice;

        const accel = firstVelocity - secondVelocity;
        acceleration = accel;
    }
}

function marketMakerOrders() {
    // Delete all previous market maker orders before creating new ones
    buyOrders = buyOrders.filter(order => !order.marketMaker);
    sellOrders = sellOrders.filter(order => !order.marketMaker);

    // Calculate the current imbalance to adjust market maker orders accordingly
    const imbalance = marketMakerBuyOrdersFilled - marketMakerSellOrdersFilled;
    let buyOrdersAdjustmentFactor = 1;
    let sellOrdersAdjustmentFactor = 1;

    // Generate market maker orders around the current price with adjustments for exposure
    const stepSize = 0.01; // Smaller step size for closer price adjustments
    const baseOrdersPerSide = 20; // Base number of orders per side (buy/sell) without adjustments
    let priceAdjustment = stepSize; // Initial price adjustment

    // Adjust the number of orders based on the current exposure
    if (imbalance > 0) {
        // More buy orders filled, reduce buy orders and increase sell orders
        buyOrdersAdjustmentFactor = Math.min(0.25,Math.abs(100/imbalance)); // Reduce buy orders
        sellOrdersAdjustmentFactor = Math.max(2,Math.abs(imbalance/100)); // Increase sell orders
    } else if (imbalance < 0) {
        // More sell orders filled, reduce sell orders and increase buy orders
        sellOrdersAdjustmentFactor = Math.min(0.25,Math.abs(100/imbalance)); // Reduce sell orders
        buyOrdersAdjustmentFactor = Math.max(2,Math.abs(imbalance/100)); // Increase buy orders
    }

    for (let i = 1; i <= baseOrdersPerSide; i++) {
        // Calculate adjusted number of orders per side based on exposure
        const adjustedBuyOrders = Math.max(0,Math.floor(5*buyOrdersAdjustmentFactor));
        const adjustedSellOrders = Math.max(0,Math.floor(5*sellOrdersAdjustmentFactor));

        // Calculate price adjustments for both buy and sell orders
        const buyPrice = Math.ceil((lastPrice - (priceAdjustment * i)) * 100) / 100;
        const sellPrice = Math.floor((lastPrice + (priceAdjustment * i)) * 100) / 100;
        const amount = 10 * i; // Amount grows as it moves away from the last price

        // Create adjusted buy and sell orders based on the current exposure
        if (i <= adjustedBuyOrders) {
            const buyOrder = {
                price: buyPrice,
                amount: amount,
                time: new Date().getTime(),
                marketMaker: true
            };
            addOrder('buy', buyOrder);
        }

        if (i <= adjustedSellOrders) {
            const sellOrder = {
                price: sellPrice,
                amount: amount,
                time: new Date().getTime(),
                marketMaker: true
            };
            addOrder('sell', sellOrder);
        }
    }
}

function addRandomOrder() {
    const order = generateOrder();
    const orderType = order.price > lastPrice ? 'sell' : 'buy';
    addOrder(orderType, order);
}   

function generateOrder() {
    const mean = lastPrice; // Use lastPrice as mean
    const stdDev = 2; // Adjusted standard deviation for more variation
    let multiplier = 1;
    if (Math.random() < 0.2) {
        multiplier = Math.random(multiplier = Math.floor(Math.random() * 1000) + 1);
    }
    else{
        multiplier = 1;
    }

    let price = normalDistribution(mean, stdDev);
    price = Math.floor(Math.max(0, Math.min(price, price*1.05))*100.0)/100.0; // Ensure price stays within 0 and 1.5x of last price
    amount = Math.floor(Math.abs(Math.random() * 100*multiplier) + 1);
    return {
        price: price,
        amount: amount,
        time: new Date().getTime(), // Add time property to track order placement
        marketMaker: false // Default to false for random orders
    }; 
}

function generateMarketOrder() {
    // Adjust probability based on the skew and length of order books
    const buySellRatio = buyOrders.length / (sellOrders.length + 1); // Adding 1 to avoid division by zero
    probability = aboveMovingAverage ? 0.4 : 0.6; // Adjust base probability based on position relative to moving average

    // Adjust probability further based on the acceleration
    if (acceleration > 0) {
        probability += 0.1; // Increase probability if acceleration is positive
    } else if (acceleration < 0) {
        probability -= 0.1; // Decrease probability if acceleration is negative
    }

    // Fine-tune probability based on the ratio of buy to sell orders
    if (buySellRatio > 2) {
        probability = Math.max(0.2, probability - 0.2); // Decrease probability if buy orders significantly outnumber sell orders, ensuring it doesn't go below 0.2
    } else if (buySellRatio < 0.5) {
        probability = Math.min(0.8, probability + 0.2); // Increase probability if sell orders significantly outnumber buy orders, ensuring it doesn't exceed 0.8
    }

    // Adjust probability based on the magnitude of orderBookSkew
    if (orderBookSkew > 100) {
        probability = Math.max(0.1, probability - 0.05); // Ensure probability doesn't go below 0.1
    } else if (orderBookSkew < -100) {
        probability = Math.min(0.9, probability + 0.05); // Ensure probability doesn't exceed 0.9
    }
    const orderType = Math.random() < probability ? 'buy' : 'sell'; // Randomly choose between buy and sell
    const amount = Math.floor(Math.random() * 100) + 1; // Generate a random amount between 1 and 100
    const order = {
        type: 'market',
        amount: amount,
        time: new Date().getTime(), // Add time property to track order placement
        marketMaker: false // Default to false for market orders
    };
    addOrder(orderType, order);
}


function togglePriceInput(orderType) {
    const priceInput = document.getElementById(`${orderType}Price`);
    priceInput.disabled = document.getElementById(`${orderType}OrderType`).value === 'market';
} 

function normalDistribution(mean, stdDev) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * stdDev + mean;
}
function addOrder(orderType, order) {
    const orders = orderType === 'buy' ? buyOrders : sellOrders;
    if(order.type === 'market') {
        order.price = orderType === 'buy' ? sellOrders[0].price : buyOrders[0].price;
        const matchingFunction = setInterval(() => {
            const newPrice = orderType === 'buy' ? sellOrders[0].price : buyOrders[0].price;
            if(order.price !== newPrice) {
                order.price = newPrice;
            }
        }, 100); // Check every 100ms for price update until order is filled
        order.matchingFunction = matchingFunction;
    } else if (order.marketMaker) {
        // For market maker orders, we don't need to set a matching function
        // as their prices are fixed and determined by the marketMakerOrders function.
        // Market maker orders are added directly with their specified price and amount.
    } else {
        // For non-market, non-market maker orders, we might add additional logic here in the future.
    }
    orders.push(order);
    // Sort orders by price, then by time for FIFO matching, and finally by marketMaker flag to prioritize them
    orders.sort((a, b) => (orderType === 'buy' ? b.price - a.price : a.price - b.price) || a.time - b.time || (a.marketMaker === b.marketMaker ? 0 : a.marketMaker ? -1 : 1));
    updateHistogram('buyHistogram', buyOrders);
    updateHistogram('sellHistogram', sellOrders);
    checkMatchingOrders();
}

function addCustomOrder(orderType, orderType2) {
    const price = orderType2 === 'market' ? (orderType === "buy" ? sellOrders[0].price : buyOrders[0].price) : parseFloat(document.getElementById(`${orderType}Price`).value);
    const amount = orderType === 'buy' && price < lastPrice ? 10 : orderType === 'sell' && price > lastPrice ? 10 : parseFloat(document.getElementById(`${orderType}Amount`).value);
    if (!isNaN(price) && !isNaN(amount)) {
        addOrder(orderType, { type: orderType2, price: price, amount: amount, time: new Date().getTime(), marketMaker: false });
    }
}

function updateHistogram(elementId, orders) {
    
    const histogramBar = document.getElementById(elementId);
    histogramBar.innerHTML = `<span>${elementId === 'buyHistogram' ? 'Buy' : 'Sell'} Orders</span>`;

    // Sort orders by price, descending for buy orders, ascending for sell orders
    const sortedOrders = orders.sort((a, b) => elementId === 'buyHistogram' ? b.price - a.price : a.price - b.price);

    // Take the best 10 orders
    const histogramResolution = parseInt(document.getElementById('histogramNumberInput').value, 10);
    const bestOrders = sortedOrders.slice(0, histogramResolution);

    const priceCounts = bestOrders.reduce((acc, order) => {
        acc[order.price] = (acc[order.price] || 0) + order.amount;
        return acc;
    }, {});

    Object.entries(priceCounts).forEach(([price, amount]) => {
        const bar = document.createElement('div');
        bar.classList.add('bar');
        bar.style.width = `${(amount / Math.max(...Object.values(priceCounts))) * 100}%`;
        bar.textContent = `Price: ${price}, Amount: ${amount}`;
        bar.style.backgroundColor = elementId === 'buyHistogram' ? '#3BB143' : '#A91B0D';
        histogramBar.appendChild(bar);
    });
}

function updateLastPrice() {
    if (buyOrders.length > 0 && sellOrders.length > 0) {
        const bestBuyPrice = buyOrders[0].price;
        const bestSellPrice = sellOrders[0].price;
        if (bestBuyPrice >= bestSellPrice) {
            lastPrice = (bestBuyPrice+bestSellPrice)/2;
        } else {
            lastPrice = bestSellPrice; // Use the best sell price if no match found
        }
    }
    document.getElementById('lastPriceValue').textContent = lastPrice;
    priceHistory.push({time: new Date().getTime(), price: lastPrice});
    if (priceHistory.length > 250) {
        priceHistory.splice(0, 50); // Remove the oldest 50 data points
    }
}

function updateLastPriceDirectly(price) {
    lastPrice = price;
    document.getElementById('lastPriceValue').textContent = lastPrice;
    priceHistory.push({time: new Date().getTime(), price: lastPrice});
    if (priceHistory.length > 1000) {
        priceHistory.splice(0, 200); // Remove the oldest 50 data points
    }
}

let matchVolumeData = [];
let lastMatchCheckTime = new Date().getTime();

function checkMatchingOrders() {
    let matchFound = buyOrders.length > 0 && sellOrders.length > 0;
    let matchesThisInterval = 0;
    while (matchFound) {
        const bestBuyOrder = buyOrders[0];
        const bestSellOrder = sellOrders[0];
        if (bestBuyOrder.price >= bestSellOrder.price) {
            const quantity = Math.min(bestBuyOrder.amount, bestSellOrder.amount);
            bestBuyOrder.amount -= quantity;
            bestSellOrder.amount -= quantity;
            matchesThisInterval += quantity;
            // Update market maker orders filled count only if not filled between the same market maker
            if (bestBuyOrder.marketMaker && !bestSellOrder.marketMaker) marketMakerBuyOrdersFilled += quantity;
            if (bestSellOrder.marketMaker && !bestBuyOrder.marketMaker) marketMakerSellOrdersFilled += quantity;
            if (bestBuyOrder.amount === 0) buyOrders.shift();
            if (bestSellOrder.amount === 0) sellOrders.shift();
            matchFound = true;
        } else {
            matchFound = false;
        }
    }
    const currentTime = new Date().getTime();
    if (currentTime - lastMatchCheckTime >= 1000 || matchVolumeData.length === 0) {
        matchVolumeData.push({time: currentTime, volume: matchesThisInterval});
        lastMatchCheckTime = currentTime;
        if (matchVolumeData.length > 20) { // Keep only the latest 20 intervals (10 minutes)
            matchVolumeData.shift();
        }
    } else if (matchVolumeData.length > 0) {
        matchVolumeData[matchVolumeData.length - 1].volume += matchesThisInterval;
    }
    console.log(`Market Maker Buy Orders Filled: ${marketMakerBuyOrdersFilled}`);
    console.log(`Market Maker Sell Orders Filled: ${marketMakerSellOrdersFilled}`);
}

function deleteOldOrders() {
    const currentTime = new Date().getTime();
    buyOrders = buyOrders.filter(order => currentTime - order.time < 60000);
    sellOrders = sellOrders.filter(order => currentTime - order.time < 60000);
}

function createLineChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: priceHistory.map(entry => new Date(entry.time).toLocaleTimeString()),
            datasets: [{
                label: 'Last Price',
                data: priceHistory.map(entry => entry.price),
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                pointRadius: 0,
            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: false
                    }
                }]
            },
            animation: {
                duration: 0,
                easing: 'linear'
            }
        }
    });
}

function updateLineChart() {
    updateLastPrice();
    if (chart) {
        chart.data.labels = priceHistory.map(entry => new Date(entry.time).toLocaleTimeString());
        chart.data.datasets.forEach((dataset) => {
            dataset.data = priceHistory.map(entry => entry.price);
        });
        chart.update({
            duration: 0,
            easing: 'linear'
        });
    }
}