# SkyHedge - Weather Derivatives DApp

## Overview
SkyHedge is a decentralized application (DApp) on Flow EVM for trading rainfall-based weather derivatives. It enables users to trade weather options, participate in community mutual aid pools, and leverage AI for risk assessment and trade optimization. The project aims to provide a comprehensive trading platform with sophisticated pricing models and community governance, integrating real-time weather data from multiple oracle sources.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture
SkyHedge features a full-stack architecture with a React 18 frontend (TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query), an Express.js backend (TypeScript, RESTful API), and a PostgreSQL database (Drizzle ORM). The application integrates with the Flow EVM testnet for blockchain operations.

Core components include:
- **Weather Options Trading System**: Offers options chains, Monte Carlo-based pricing, risk analytics (Greeks), and automated settlement.
- **Community Mutual Aid Pools**: Supports creating and managing community insurance pools with on-chain governance and flexible payout distribution.
- **Portfolio Management System**: Provides real-time tracking of positions, P&L calculations, and risk monitoring.
- **Community Staking System**: Enables multi-token staking (FLOW, FLR) with smart contract integration for governance voting and yield farming, supporting both Flow EVM and Flare Coston2.
- **AI-Powered Analytics**: Integrates OpenAI GPT-4o for trade recommendations, AI-driven risk assessment, trade optimization, and backtesting.
- **Hybrid Weather Data Integration**: Combines WeatherXM and Chainlink oracles for rainfall data, and Flare network for wind data, ensuring data accuracy through cross-validation, variance detection, and blockchain verification.

The system processes weather data from sensors, verifies it, and feeds it to smart contracts. The trading flow involves user selection, AI suggestions, options chain display, and smart contract execution. Community pools facilitate proposals, voting, and automatic payouts.

## External Dependencies
**Blockchain & Web3**:
- Flow EVM (smart contract deployment)
- MetaMask (wallet connectivity)
- Web3 Libraries (blockchain interaction)

**Weather Data**:
- WeatherXM API (primary rainfall data)
- Chainlink Oracle Network (multi-source rainfall aggregation and verification)
- Flare Data Connector (wind data)

**AI & Analytics**:
- OpenAI GPT-4o (NLP, trade recommendations)
- Monte Carlo Simulation (options pricing, risk modeling)

**UI & Styling**:
- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide Icons

## Recent Changes
- August 17, 2025. Implemented comprehensive community staking system with multi-token support for FLOW and FLR tokens
- August 17, 2025. Created CommunityStaking.sol smart contract with governance voting, rewards distribution, and emergency withdrawals  
- August 17, 2025. Built full-stack staking infrastructure with backend service, API routes, and frontend dashboard
- August 17, 2025. Added multi-chain staking support: Flow EVM for FLOW tokens, Flare Coston2 for FLR tokens with cross-chain compatibility
- August 17, 2025. Integrated real-time APY calculations, flexible lock periods, and compound rewards with slashing protection
- August 17, 2025. Created comprehensive staking dashboard with position tracking, rewards claiming, and governance voting interface
- August 17, 2025. Moved Community Staking navigation from header to Community tab for better organization
- August 17, 2025. Added community section header with description and integrated staking access
- August 17, 2025. **COMPLETED**: Deployed RainfallIndex.sol smart contract to Flow EVM with full API integration
- August 17, 2025. **COMPLETED**: Added comprehensive Flow EVM service with contract interaction, deployment, and oracle data management
- August 17, 2025. **COMPLETED**: Integrated Flow EVM API routes for options creation, rainfall data updates, and gas estimation
- August 17, 2025. **COMPLETED**: Created detailed Flow EVM deployment documentation with contract specifications and integration guides