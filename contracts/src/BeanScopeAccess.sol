// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BeanScopeAccess {
    address public owner;
    uint256 public dayPassPrice;
    uint256 public weekPassPrice;
    uint256 public lifetimePrice;

    mapping(address => uint256) public accessExpiry;

    event AccessGranted(address indexed user, uint256 expiry, uint256 paid);
    event PricesUpdated(uint256 day, uint256 week, uint256 lifetime);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor(uint256 _day, uint256 _week, uint256 _lifetime) {
        owner = msg.sender;
        dayPassPrice = _day;
        weekPassPrice = _week;
        lifetimePrice = _lifetime;
    }

    function buyDayPass() external payable {
        require(msg.value >= dayPassPrice, "Insufficient ETH");
        _extend(msg.sender, 1 days);
    }

    function buyWeekPass() external payable {
        require(msg.value >= weekPassPrice, "Insufficient ETH");
        _extend(msg.sender, 7 days);
    }

    function buyLifetime() external payable {
        require(msg.value >= lifetimePrice, "Insufficient ETH");
        accessExpiry[msg.sender] = type(uint256).max;
        emit AccessGranted(msg.sender, type(uint256).max, msg.value);
    }

    function hasAccess(address user) external view returns (bool) {
        return accessExpiry[user] >= block.timestamp;
    }

    function _extend(address user, uint256 duration) internal {
        uint256 current = accessExpiry[user];
        uint256 start = current > block.timestamp ? current : block.timestamp;
        accessExpiry[user] = start + duration;
        emit AccessGranted(user, accessExpiry[user], msg.value);
    }

    function setPrices(uint256 _d, uint256 _w, uint256 _l) external onlyOwner {
        dayPassPrice = _d;
        weekPassPrice = _w;
        lifetimePrice = _l;
        emit PricesUpdated(_d, _w, _l);
    }

    function withdraw() external onlyOwner {
        (bool ok,) = payable(owner).call{value: address(this).balance}("");
        require(ok, "Transfer failed");
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }
}
