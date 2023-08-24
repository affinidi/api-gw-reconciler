# Contributing affinidi/api-gw-reconciler


When contributing to this repository, please first discuss the change you wish to make via issue,
email, or any other method with the owners of this repository before making a change.

Please note we have a code of conduct, please follow it in all your interactions with the project.

## Bug

1. Ensure the bug was not already reported by searching on GitHub under
[Issues](https://github.com/affinidi/api-gw-reconciler/issues).
2. If you're unable to find an open issue addressing the problem,
[open a new one](https://github.com/affinidi/api-gw-reconciler/issues/new).
Be sure to include a **title and clear description**, as much relevant information as possible,
and a **code sample** or an **executable test case** demonstrating the expected behavior that is not occurring.

## Code quality expectations


1. Ensure the pipeline checks finished successfully.
2. Ensure pull request doesn't contain redundant comments, console.log, etc.
3. Ensure your code is covered with unit and integration tests (NOTE: no mocks/stubs in integration tests).
4. Avoid adding comments to explain what code does, code should be self-explanatory and clean.
5. Ensure to add `typedoc`'s types: `@description`, `@param`, `@returns` with proper description
when introducing new method.
6. Avoid using variable names like `i` or abbreviations - names should simple and unambiguous.


## Code of Conduct

### Our Pledge

In the interest of fostering an open and welcoming environment, we as
contributors and maintainers pledge to making participation in our project and
our community a harassment-free experience for everyone, regardless of age, body
size, disability, ethnicity, gender identity and expression, level of experience,
nationality, personal appearance, race, religion, or sexual identity and
orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment
include:

* Using welcoming and inclusive language
* Being respectful of differing viewpoints and experiences
* Gracefully accepting constructive criticism
* Focusing on what is best for the community
* Showing empathy towards other community members
* Avoiding obvious comments about things like code styling and indentation. 
** If you see yourself wanting to do that more than once - open issue with a repo to update the ESLint/Prettier rules to address this concern once and for all. **Code reviews should be about logic, not indenting or adding more newlines**

Examples of unacceptable behavior by participants include:

* The use of sexualized language or imagery and unwelcome sexual attention or
advances
* Trolling, insulting/derogatory comments, and personal or political attacks
* Public or private harassment
* Publishing others' private information, such as a physical or electronic
  address, without explicit permission
* Other conduct which could reasonably be considered inappropriate in a
  professional setting