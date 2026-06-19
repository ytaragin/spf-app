---
name: code-review
description: GitHub code review operations - approve PRs, request changes, comment on code, and manage review workflows using gh CLI
---

# GitHub Code Review Skill

This skill provides code review operations for pull requests, including approving, requesting changes, commenting on code, and managing review workflows.

## Available Operations

### 1. Approve Pull Request
Approve a PR indicating the changes look good.

### 2. Request Changes
Request changes on a PR with specific feedback.

### 3. Comment on Pull Request
Add general comments or review feedback without approving/rejecting.

### 4. Add Line Comments
Comment on specific lines or ranges of code.

### 5. View Reviews
See all reviews submitted on a PR.

### 6. Dismiss Review
Dismiss a stale or incorrect review.

## Usage Examples

### Approve Pull Request

**Simple approval:**
```bash
gh pr review 123 --approve --repo owner/repo-name
```

**Approval with comment:**
```bash
gh pr review 123 --approve --repo owner/repo-name --body "LGTM! Great work on this feature."
```

**Approve after testing:**
```bash
gh pr checkout 123 --repo owner/repo-name
# Run tests
npm test
# If tests pass
gh pr review 123 --approve --body "Tested locally. All tests pass."
```

### Request Changes

**Request changes with feedback:**
```bash
gh pr review 123 --request-changes --repo owner/repo-name --body "Please address the following issues:
- Add error handling in auth.js
- Update unit tests
- Fix typo in README"
```

**Request changes with specific concerns:**
```bash
gh pr review 123 --request-changes --repo owner/repo-name --body "Security concern: The API key is exposed in the client code. Please move it to environment variables."
```

### Comment on Pull Request

**General comment:**
```bash
gh pr review 123 --comment --repo owner/repo-name --body "This looks good overall, but I have a few questions before approving."
```

**Comment without formal review:**
```bash
gh pr comment 123 --repo owner/repo-name --body "Have you considered using async/await instead of promises here?"
```

**Ask for clarification:**
```bash
gh pr comment 123 --repo owner/repo-name --body "Can you explain the rationale behind the new caching strategy?"
```

### Add Line Comments

**Comment on specific line (interactive):**
```bash
gh pr view 123 --repo owner/repo-name --web
# Use web interface to add inline comments
```

**Comment on code via API:**
```bash
# First, get the PR diff to find the position
gh pr diff 123 --repo owner/repo-name

# Add review comment at specific position
gh api repos/owner/repo-name/pulls/123/reviews \
  -f body="Review comments" \
  -f event="COMMENT" \
  -f 'comments[][path]=src/main.js' \
  -f 'comments[][position]=10' \
  -f 'comments[][body]=Consider adding error handling here'
```

**Multiple inline comments:**
```bash
gh api repos/owner/repo-name/pulls/123/reviews \
  -f body="Found several issues" \
  -f event="REQUEST_CHANGES" \
  -f 'comments[][path]=src/auth.js' \
  -f 'comments[][line]=25' \
  -f 'comments[][body]=This function needs error handling' \
  -f 'comments[][path]=src/utils.js' \
  -f 'comments[][line]=45' \
  -f 'comments[][body]=Add input validation'
```

### View Reviews

**List all reviews:**
```bash
gh pr view 123 --repo owner/repo-name --json reviews
```

**View reviews with details:**
```bash
gh api repos/owner/repo-name/pulls/123/reviews --jq '.[] | {reviewer: .user.login, state: .state, body: .body}'
```

**Check review decision:**
```bash
gh pr view 123 --repo owner/repo-name --json reviewDecision --jq '.reviewDecision'
# Returns: APPROVED, CHANGES_REQUESTED, REVIEW_REQUIRED, or null
```

**See who approved:**
```bash
gh api repos/owner/repo-name/pulls/123/reviews --jq '.[] | select(.state=="APPROVED") | .user.login'
```

**See who requested changes:**
```bash
gh api repos/owner/repo-name/pulls/123/reviews --jq '.[] | select(.state=="CHANGES_REQUESTED") | {reviewer: .user.login, feedback: .body}'
```

### Dismiss Review

**Dismiss a review:**
```bash
gh api repos/owner/repo-name/pulls/123/reviews/<review-id>/dismissals \
  -X PUT \
  -f message="Addressed in latest commit"
```

**Find and dismiss outdated reviews:**
```bash
# Get review ID
REVIEW_ID=$(gh api repos/owner/repo-name/pulls/123/reviews --jq '.[0].id')

# Dismiss it
gh api repos/owner/repo-name/pulls/123/reviews/$REVIEW_ID/dismissals \
  -X PUT \
  -f message="Code has been updated per feedback"
```

## Common Patterns

### Complete Review Workflow

```bash
# 1. Get list of PRs needing review
gh pr list --search "review-requested:@me" --repo owner/repo-name

# 2. View PR details
gh pr view 123 --repo owner/repo-name

# 3. Check out PR locally for testing
gh pr checkout 123 --repo owner/repo-name

# 4. Review the code
git log --oneline -5
git diff main..HEAD

# 5. Run tests
npm test

# 6. Check code quality
npm run lint

# 7. Submit review
gh pr review 123 --approve --body "Reviewed and tested. Looks good!"
```

### Thorough Code Review Process

```bash
# 1. Start review
gh pr view 123 --repo owner/repo-name --comments

# 2. Check changed files
gh pr diff 123 --repo owner/repo-name --name-only

# 3. Review each file
gh pr diff 123 --repo owner/repo-name -- src/component.js

# 4. Test locally
gh pr checkout 123
npm install
npm test
npm run build

# 5. Add feedback
gh pr review 123 --comment --body "Tested locally. A few suggestions:
- Add JSDoc comments to public methods
- Consider extracting the validation logic
- Tests look good!"

# 6. Follow up after changes
gh pr review 123 --approve --body "Thanks for addressing the feedback!"
```

### Reviewer Requesting Changes

```bash
# 1. Review the PR
gh pr view 123 --repo owner/repo-name

# 2. Identify issues
gh pr diff 123 --repo owner/repo-name

# 3. Request changes with specific feedback
gh pr review 123 --request-changes --body "Please address:

**Security:**
- [ ] Move API keys to environment variables
- [ ] Add input sanitization

**Testing:**
- [ ] Add unit tests for new functions
- [ ] Update integration tests

**Documentation:**
- [ ] Update README with new API usage
- [ ] Add inline comments for complex logic"

# 4. Wait for updates
gh pr view 123 --json commits --jq '.commits | length'

# 5. Re-review after changes
gh pr review 123 --approve --body "All concerns addressed. Thanks!"
```

### Team Review Coordination

```bash
# Request reviews from specific people
gh pr edit 123 --repo owner/repo-name \
  --add-reviewer security-expert,frontend-lead,qa-engineer

# Check review status
gh pr view 123 --json reviews --jq '.reviews[] | {reviewer: .author.login, status: .state}'

# Remind reviewers
gh pr comment 123 --body "@security-expert @frontend-lead Friendly reminder to review when you have time"

# Check if all required reviews are complete
gh pr view 123 --json reviewDecision
```

### Handling Review Feedback

```bash
# View feedback as PR author
gh pr view 123 --comments

# Address each comment
git commit -m "fix: address review feedback"
git push

# Comment on resolution
gh pr comment 123 --body "Updated per review feedback:
- Added error handling
- Improved test coverage
- Updated documentation"

# Request re-review
gh api repos/owner/repo-name/pulls/123/requested_reviewers \
  -f 'reviewers[]=reviewer-username'
```

## Review Templates

### Security Review Template
```bash
gh pr review 123 --comment --body "## Security Review Checklist

- [ ] Input validation present
- [ ] Authentication checks in place
- [ ] Authorization verified
- [ ] No sensitive data in logs
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Dependencies up to date

Please confirm these are addressed."
```

### Performance Review Template
```bash
gh pr review 123 --comment --body "## Performance Review

- [ ] No N+1 queries
- [ ] Appropriate caching
- [ ] Database indexes present
- [ ] No blocking operations in main thread
- [ ] Pagination for large datasets
- [ ] Efficient algorithms used

Please verify performance implications."
```

### Code Quality Template
```bash
gh pr review 123 --comment --body "## Code Quality Checklist

- [ ] Follows project style guide
- [ ] No code duplication
- [ ] Proper error handling
- [ ] Meaningful variable names
- [ ] Functions are single-purpose
- [ ] Comments explain why, not what
- [ ] Tests added/updated

Overall structure looks good!"
```

## Best Practices

1. **Be constructive**: Focus on the code, not the person
2. **Be specific**: Point to exact lines and suggest alternatives
3. **Explain reasoning**: Help others learn from your feedback
4. **Prioritize issues**: Distinguish between critical and nice-to-have
5. **Test locally**: Check out and run the code when possible
6. **Be timely**: Review PRs promptly to unblock others
7. **Use checklists**: Ensure consistent review criteria
8. **Ask questions**: Seek to understand before criticizing
9. **Acknowledge good work**: Call out clever solutions
10. **Follow up**: Verify that feedback was properly addressed

## Review States

```
COMMENTED    - General feedback without approval/rejection
APPROVED     - Changes approved
CHANGES_REQUESTED - Changes needed before merge
DISMISSED    - Review no longer relevant
```

## Integration with Other Skills

- Use `pull-request-management` to view PR details before reviewing
- Use `commit-operations` to review commit history
- Use `issue-management` to reference related issues
- Use `repository-management` to check file history

## Keyboard Shortcuts (Web UI)

When reviewing in browser:
- `r` - Start a review
- `c` - Comment on line
- `e` - Edit comment
- `ctrl+enter` - Submit comment

## References

- [GitHub CLI Review Documentation](https://cli.github.com/manual/gh_pr_review)
- [GitHub Code Review Guide](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests)
- [Best Practices for Code Review](https://google.github.io/eng-practices/review/)
