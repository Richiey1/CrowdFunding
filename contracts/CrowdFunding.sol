// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Crowdfunding {
    struct Project {
        address creator;
        IERC20 token;
        uint256 goal;
        uint256 deadline;
        uint256 fundRaised;
        bool fundsReleased;
    }

    uint256 public projectCount;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event ProjectCreated(uint256 projectId, address creator, uint256 goal, uint256 deadline);
    event Funded(uint256 projectId, address backer, uint256 amount);
    event FundsReleased(uint256 projectId, uint256 amount);
    event RefundClaimed(uint256 projectId, address backer, uint256 amount);

    // Create a new project
    function createProject(IERC20 _token, uint256 _goal, uint256 _duration) external {
        require(msg.sender != address(0), "Invalid Address");
        require(_goal > 0, "Goal must be greater than zero");
        require(_duration > 0, "Duration must be greater than zero");

        projectCount++;
        projects[projectCount] = Project({
            creator: msg.sender,
            token: _token,
            goal: _goal,
            deadline: block.timestamp + _duration,
            fundRaised: 0,
            fundsReleased: false
        });

        emit ProjectCreated(projectCount, msg.sender, _goal, block.timestamp + _duration);
    }

    // Fund a project
    function fundProject(uint256 projectId, uint256 amount) external {
        Project storage project = projects[projectId];
        require(block.timestamp < project.deadline, "Funding period has ended");
        require(amount > 0, "Funding must be greater than zero");

        project.token.transferFrom(msg.sender, address(this), amount);
        contributions[projectId][msg.sender] += amount;
        project.fundRaised += amount;

        emit Funded(projectId, msg.sender, amount);
    }

    // Release funds if the goal is met
    function releaseFunds(uint256 projectId) external {
        Project storage project = projects[projectId];
        require(msg.sender == project.creator, "Only creator can release funds");
        require(block.timestamp > project.deadline, "Funds cannot be released before deadline");
        require(project.fundRaised >= project.goal, "Funding goal not reached");
        require(!project.fundsReleased, "Funds already released");

        project.fundsReleased = true;
        project.token.transfer(project.creator, project.fundRaised);

        emit FundsReleased(projectId, project.fundRaised);
    }

    // Refund contributors if the goal is not met
    function claimRefund(uint256 projectId) external {
        Project storage project = projects[projectId];
        require(block.timestamp >= project.deadline, "Funding period not ended");
        require(project.fundRaised < project.goal, "Funding goal reached, no refunds");

        uint256 contribution = contributions[projectId][msg.sender];
        require(contribution > 0, "No funds to refund");

        contributions[projectId][msg.sender] = 0;
        project.token.transfer(msg.sender, contribution);

        emit RefundClaimed(projectId, msg.sender, contribution);
    }
}
