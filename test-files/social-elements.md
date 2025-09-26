# Social Elements Test Document

This document tests the new social elements functionality in extended-adf-markdown-parser v2.1.0.

## User Mentions

Hello {user:john.doe}! Please review this document.

The project team includes:
- {user:alice.developer} (Lead Developer)
- {user:bob.designer} (UI/UX Designer) 
- {user:carol.manager} (Project Manager)

## Emoji Support

Great work everyone! :thumbsup: :rocket:

Let's celebrate our success :tada: and keep the momentum going :muscle:

Status indicators:
- Completed tasks :white_check_mark:
- In progress :hourglass_flowing_sand:
- Blocked items :warning:

## Date References

Important dates:
- Project kickoff: {date:2024-01-01}
- First milestone: {date:2024-01-15}
- Final delivery: {date:2024-02-01}

## Status Tracking

Current project status: {status:on-track}

Component status updates:
- Frontend: {status:completed}
- Backend API: {status:in-progress}
- Testing: {status:not-started}
- Documentation: {status:review}

## Media References

Here's our latest dashboard screenshot:

![Dashboard Screenshot](media:dashboard-v2)

Architecture diagram:

![System Architecture](media:architecture-diagram)

## Inline Cards

Useful resources:
- [Project Requirements](card:https://company.atlassian.net/wiki/requirements)
- [Technical Specifications](card:https://docs.company.com/tech-specs)
- [User Stories](card:https://company.atlassian.net/browse/PROJ-123)

## Mixed Content Example

Hi {user:dev.team} :wave:

Our sprint review is scheduled for {date:2024-01-20}. Current status: {status:on-schedule}

Please check the [sprint board](card:https://company.atlassian.net/sprint) and review the updated mockups:

![Updated Mockups](media:mockups-v3)

Thanks! :rocket:

## Advanced Panel Combinations

~~~panel type=info title="Multi-element panel testing"
Team lead {user:panel.lead} scheduled review for {date:2024-01-25}.
Current progress: {status:on-track} :thumbsup:

![Panel Progress](media:panel-progress-chart)
~~~

~~~panel type=warning title="System maintenance window"
Maintenance scheduled: {date:2024-02-01} by {user:maintenance.team}
Expected duration: 4 hours :hourglass_flowing_sand:
Backup contact: {user:emergency.contact}
Status during maintenance: {status:unavailable}
~~~

## Expand Sections with Rich Content

<details>
<summary>🎯 **Project Metrics** - Updated {date:2024-01-20}</summary>

Performance indicators by {user:metrics.analyst}:

### Current Status
- Overall: {status:excellent} :star:
- Performance: {status:optimal} :zap:
- User Satisfaction: {status:high} :heart:

### Visual Metrics
![Performance Dashboard](media:performance-overview)
![User Engagement](media:user-engagement-stats)

### Team Performance
| Team | Lead | Status | Trend |
|------|------|--------|--------|
| Frontend | {user:fe.lead} | {status:excellent} | :chart_with_upwards_trend: |
| Backend | {user:be.lead} | {status:good} | :arrow_up: |
| DevOps | {user:ops.lead} | {status:optimal} | :rocket: |

Next review: {date:2024-02-15} with {user:executive.reviewer}

</details>

<details>
<summary>📋 **Resource Library** - Curated by {user:resource.manager}</summary>

Essential links updated {date:2024-01-18}:

**Documentation:**
- [API Specs](card:https://api-docs.company.com/v3) - Status: {status:current}
- [User Manual](card:https://help.company.com/manual) - Review: {status:complete}

**Development:**  
- [Code Standards](card:https://standards.company.com) - Owner: {user:standards.keeper}
- [CI/CD Guide](card:https://cicd.company.com) - Status: {status:active}

![Resource Map](media:resource-architecture)

Contact {user:resource.support} for access issues.

</details>

## Complex Table with All Elements

### Project Dashboard - {date:2024-01-31}

| Feature | Owner | Preview | Status | Deadline | Notes |
|---------|-------|---------|---------|----------|-------|
| User Auth | {user:auth.dev} | ![Auth UI](media:auth-preview) | {status:completed} | {date:2024-01-15} | :white_check_mark: Done |
| Dashboard | {user:ui.specialist} | ![Main Dashboard](media:dash-preview) | {status:in-progress} | {date:2024-02-01} | :construction: 80% complete |
| Reports | {user:data.analyst} | ![Reports View](media:reports-preview) | {status:review} | {date:2024-02-10} | :eyes: Pending review |
| Mobile App | {user:mobile.dev} | ![Mobile Screenshots](media:mobile-preview) | {status:planning} | {date:2024-03-01} | :calendar: Next sprint |

**Dashboard managed by {user:project.coordinator}** :gear:

## Mixed Media Gallery

Team celebration from our recent milestone {date:2024-01-20}! :tada:

![Team Photo](media:team-celebration)

Individual achievements:
- Top contributor: {user:star.performer} :trophy:
- Innovation award: {user:creative.genius} :bulb:  
- Collaboration champion: {user:team.builder} :handshake:

![Achievement Ceremony](media:awards-ceremony)

Status update: {status:celebrating} :confetti_ball:

## Final Test Summary

Comprehensive testing completed by {user:test.lead} on {date:2024-01-31}:

~~~panel type=success title="All rich media elements tested"
![Test Results](media:comprehensive-test-results)

**Coverage:**
- Social Elements: :white_check_mark: {status:complete}
- Media Integration: :white_check_mark: {status:verified} 
- Panel Combinations: :white_check_mark: {status:tested}
- Table Complexity: :white_check_mark: {status:validated}

Next validation: {date:2024-02-15} by {user:final.validator}
~~~

[Complete Test Report](card:https://testing.company.com/rich-media-report) :clipboard: