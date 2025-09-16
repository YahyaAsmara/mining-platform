import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Cpu, Zap, DollarSign, Activity, TrendingUp, Settings, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import * as THREE from 'three';

const MiningSimulation = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [hashrate, setHashrate] = useState(100); // TH/s for BTC
  const [powerConsumption, setPowerConsumption] = useState(3250); // Watts
  const [electricityRate, setElectricityRate] = useState(0.08); // $/kWh
  const [poolFee, setPoolFee] = useState(1.5); // %
  const [difficulty, setDifficulty] = useState(50000000000000);
  const [blockReward, setBlockReward] = useState(6.25);
  const [coinPrice, setCoinPrice] = useState(45000);
  const [miningData, setMiningData] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [blocksFound, setBlocksFound] = useState(0);
  const [runtime, setRuntime] = useState(0);
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  const cryptocoins = {
    BTC: { name: 'Bitcoin', price: 45000, reward: 6.25, difficulty: 50000000000000, algorithm: 'SHA-256' },
    ETH: { name: 'Ethereum', price: 2800, reward: 2, difficulty: 15000000000000000, algorithm: 'Ethash' },
    LTC: { name: 'Litecoin', price: 75, reward: 12.5, difficulty: 24000000, algorithm: 'Scrypt' },
    DOGE: { name: 'Dogecoin', price: 0.08, reward: 10000, difficulty: 8000000, algorithm: 'Scrypt' }
  };

  const hardwareTypes = [
    { name: 'Antminer S19 Pro', hashrate: 110, power: 3250, price: 8000, efficiency: 29.5 },
    { name: 'Whatsminer M30S++', hashrate: 112, power: 3472, price: 7500, efficiency: 31 },
    { name: 'RTX 4090', hashrate: 0.13, power: 450, price: 1600, efficiency: 3461 },
    { name: 'RTX 3080', hashrate: 0.1, power: 320, price: 800, efficiency: 3200 }
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88'];

  // Initialize Three.js mining rig visualization
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(600, 400);
    renderer.setClearColor(0x000000, 0.1);
    mountRef.current.appendChild(renderer.domElement);

    // Create mining rig setup
    const rigGroup = new THREE.Group();
    
    // Main frame
    const frameGeometry = new THREE.BoxGeometry(6, 4, 2);
    const frameMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    rigGroup.add(frame);

    // Mining ASICs/GPUs
    for (let i = 0; i < 8; i++) {
      const asicGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.6);
      const asicMaterial = new THREE.MeshPhongMaterial({ 
        color: isRunning ? 0x00ff00 : 0x666666,
        emissive: isRunning ? 0x002200 : 0x000000
      });
      const asic = new THREE.Mesh(asicGeometry, asicMaterial);
      asic.position.set(-2.5 + (i % 4) * 1.2, -1 + Math.floor(i / 4) * 1, 1.2);
      rigGroup.add(asic);
    }

    // Fans
    for (let i = 0; i < 4; i++) {
      const fanGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
      const fanMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
      const fan = new THREE.Mesh(fanGeometry, fanMaterial);
      fan.position.set(-1.5 + i * 1, 2.2, 0);
      fan.rotation.x = Math.PI / 2;
      rigGroup.add(fan);
    }

    scene.add(rigGroup);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    camera.position.set(8, 6, 8);
    camera.lookAt(0, 0, 0);

    sceneRef.current = { scene, camera, renderer, rigGroup };

    const animate = () => {
      requestAnimationFrame(animate);
      if (rigGroup) {
        rigGroup.rotation.y += 0.002;
        // Animate fans when mining
        if (isRunning) {
          rigGroup.children.forEach((child, index) => {
            if (index > 8 && index <= 12) { // Fan objects
              child.rotation.z += 0.3;
            }
          });
        }
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isRunning]);

  // Mining simulation loop
  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setRuntime(prev => prev + 1);
        
        // Calculate mining metrics
        const coin = cryptocoins[selectedCoin];
        const networkHashrate = difficulty / (10 * 60); // Approximate network hashrate
        const myHashrate = hashrate * 1e12; // Convert TH/s to H/s
        const blockTime = 600; // 10 minutes in seconds
        const probabilityPerSecond = myHashrate / networkHashrate / blockTime;
        
        // Daily earnings calculation
        const secondsPerDay = 86400;
        const expectedBlocksPerDay = probabilityPerSecond * secondsPerDay;
        const dailyRevenue = expectedBlocksPerDay * blockReward * coinPrice;
        const dailyPowerCost = (powerConsumption / 1000) * 24 * electricityRate;
        const dailyProfit = dailyRevenue * (1 - poolFee / 100) - dailyPowerCost;
        
        // Random block finding simulation
        if (Math.random() < probabilityPerSecond) {
          setBlocksFound(prev => prev + 1);
          setTotalEarnings(prev => prev + blockReward * coinPrice * (1 - poolFee / 100));
        }

        // Add data point
        setMiningData(prev => {
          const newData = [...prev, {
            time: runtime,
            hashrate: hashrate + (Math.random() - 0.5) * 5,
            power: powerConsumption + (Math.random() - 0.5) * 100,
            temperature: 65 + Math.random() * 20,
            profit: dailyProfit / 24, // Hourly profit
            revenue: dailyRevenue / 24, // Hourly revenue
            efficiency: (hashrate / (powerConsumption / 1000)).toFixed(2)
          }];
          return newData.slice(-50); // Keep last 50 points
        });

        // Simulate difficulty adjustment (every 100 seconds = 2016 blocks simulation)
        if (runtime % 100 === 0) {
          setDifficulty(prev => prev * (0.98 + Math.random() * 0.04));
        }

        // Simulate price fluctuation
        setCoinPrice(prev => prev * (0.995 + Math.random() * 0.01));
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, runtime, hashrate, powerConsumption, electricityRate, poolFee, selectedCoin, difficulty, blockReward, coinPrice]);

  const toggleMining = () => {
    setIsRunning(!isRunning);
  };

  const resetSimulation = () => {
    setIsRunning(false);
    setRuntime(0);
    setMiningData([]);
    setTotalEarnings(0);
    setBlocksFound(0);
    setDifficulty(cryptocoins[selectedCoin].difficulty);
    setCoinPrice(cryptocoins[selectedCoin].price);
    setBlockReward(cryptocoins[selectedCoin].reward);
  };

  const exportData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Time,Hashrate(TH/s),Power(W),Temperature(C),Hourly_Profit($),Revenue($)\n"
      + miningData.map(row => 
        `${row.time},${row.hashrate},${row.power},${row.temperature},${row.profit},${row.revenue}`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mining_simulation_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentCoin = cryptocoins[selectedCoin];
  const dailyRevenue = ((hashrate * 1e12) / (difficulty / 600)) * blockReward * coinPrice * 144;
  const dailyCost = (powerConsumption / 1000) * 24 * electricityRate;
  const dailyProfit = dailyRevenue * (1 - poolFee / 100) - dailyCost;

  const profitabilityData = [
    { name: 'Revenue', value: dailyRevenue, color: '#10B981' },
    { name: 'Electricity', value: dailyCost, color: '#EF4444' },
    { name: 'Pool Fee', value: dailyRevenue * (poolFee / 100), color: '#F59E0B' },
    { name: 'Net Profit', value: Math.max(0, dailyProfit), color: '#3B82F6' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 mb-6 border border-white/20">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Cpu className="w-8 h-8 text-yellow-400" />
              <h1 className="text-3xl font-bold text-white">Cryptocurrency Mining Simulator</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={toggleMining}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  isRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isRunning ? 'Stop Mining' : 'Start Mining'}</span>
              </button>
              <button
                onClick={resetSimulation}
                className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Square className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={exportData}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-400" />
                <span className="text-gray-300 text-sm">Runtime</span>
              </div>
              <div className="text-2xl font-bold text-white">{Math.floor(runtime / 3600)}h {Math.floor((runtime % 3600) / 60)}m</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-300 text-sm">Total Earnings</span>
              </div>
              <div className="text-2xl font-bold text-white">${totalEarnings.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">Blocks Found</span>
              </div>
              <div className="text-2xl font-bold text-white">{blocksFound}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-red-400" />
                <span className="text-gray-300 text-sm">Daily Profit</span>
              </div>
              <div className={`text-2xl font-bold ${dailyProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${dailyProfit.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Mining Configuration</h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cryptocurrency</label>
                  <select
                    value={selectedCoin}
                    onChange={(e) => {
                      setSelectedCoin(e.target.value);
                      const coin = cryptocoins[e.target.value];
                      setCoinPrice(coin.price);
                      setDifficulty(coin.difficulty);
                      setBlockReward(coin.reward);
                    }}
                    className="w-full bg-gray-700 text-white p-2 rounded-lg border border-gray-600"
                  >
                    {Object.entries(cryptocoins).map(([key, coin]) => (
                      <option key={key} value={key}>
                        {coin.name} ({key}) - {coin.algorithm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Hashrate ({selectedCoin === 'ETH' || selectedCoin.includes('GPU') ? 'MH/s' : 'TH/s'}): {hashrate}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    step="1"
                    value={hashrate}
                    onChange={(e) => setHashrate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Power Consumption (W): {powerConsumption}
                  </label>
                  <input
                    type="range"
                    min="300"
                    max="5000"
                    step="50"
                    value={powerConsumption}
                    onChange={(e) => setPowerConsumption(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Electricity Rate ($/kWh): {electricityRate}
                  </label>
                  <input
                    type="range"
                    min="0.02"
                    max="0.30"
                    step="0.01"
                    value={electricityRate}
                    onChange={(e) => setElectricityRate(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Pool Fee (%): {poolFee}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.1"
                    value={poolFee}
                    onChange={(e) => setPoolFee(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-gray-300">Efficiency</div>
                      <div className="text-lg font-bold text-blue-400">
                        {(hashrate / (powerConsumption / 1000)).toFixed(1)} {selectedCoin === 'ETH' ? 'MH/kW' : 'TH/kW'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-300">{currentCoin.name} Price</div>
                      <div className="text-lg font-bold text-green-400">
                        ${coinPrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3D Mining Rig Visualization */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex items-center space-x-2 mb-4">
                <Cpu className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xl font-semibold text-white">Mining Rig Status</h3>
              </div>
              <div ref={mountRef} className="w-full h-96 rounded-lg overflow-hidden bg-black/20" />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-gray-300">Status</div>
                  <div className={`text-lg font-bold ${isRunning ? 'text-green-400' : 'text-red-400'}`}>
                    {isRunning ? 'Mining' : 'Stopped'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-gray-300">Temperature</div>
                  <div className="text-lg font-bold text-orange-400">
                    {(65 + Math.random() * 20).toFixed(1)}°C
                  </div>
                </div>
              </div>
            </div>

            {/* Profitability Breakdown */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-4">Daily Profitability</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={profitabilityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({name, value}) => `${name}: ${value.toFixed(2)}`}
                    >
                      {profitabilityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Real-time Performance Charts */}
          <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Real-time Mining Metrics</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg text-white mb-2">Hashrate & Power</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={miningData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis yAxisId="left" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="hashrate" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={false}
                        name="Hashrate (TH/s)"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="power" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        dot={false}
                        name="Power (W)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div>
                <h4 className="text-lg text-white mb-2">Profitability</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={miningData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="time" stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        dot={false}
                        name="Revenue ($/h)"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="profit" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        dot={false}
                        name="Profit ($/h)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Hardware Comparison */}
          <div className="mt-6 bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4">Hardware Comparison</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hardwareTypes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.7)" fontSize={10} />
                  <YAxis stroke="rgba(255,255,255,0.7)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="efficiency" fill="#8884d8" name="Efficiency (TH/kW)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiningSimulation;
