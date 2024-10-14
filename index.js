import core from '@actions/core';
import GitHubProject from 'github-project';

const run = async () => {
    try {
        const owner = core.getInput('owner');
        const number = Number(core.getInput('number'));
        const token = core.getInput('token');
        const iterationField = core.getInput('iteration-field'); // name of the iteration field
        const iterationType = core.getInput('iteration'); // iteration name
        const statuses = core.getInput('statuses').split(',');
        const coreExclusedStatuses = core.getInput('excluded-statuses');

        // Test outputs:
        core.setOutput('Owner', owner);
        core.setOutput('Number', number);
        core.setOutput('Iteration', iterationType);
        core.setOutput('Iteration-field', iterationField);


        const excludedStatuses = coreExclusedStatuses ? coreExclusedStatuses.split(',') : [];

        const project = new GitHubProject({ owner, number, token, fields: { iteration: iterationField } });

        const projectData = await project.getProperties();

        const lastIteration = projectData.fields.iteration.configuration.completedIterations[0];
        const currentIteration = projectData.fields.iteration.configuration.iterations[0];
        const nextIteration = projectData.fields.iteration.configuration.iterations[1];

        var iteration = iterationType;

        switch (iterationType) {
            case 'last':
                iteration = lastIteration;
                break;
            case 'current':
                iteration = currentIteration;
                break;
            case 'next':
                iteration = nextIteration;
                break;
            default:
                iteration = iterationType;
                break;
        }

        const items = await project.items.list();

        const filteredItems = items.filter(item => {
            // If item is not in the given iteration, return false.
            if (item.fields.iteration !== iteration.title) return false;
            // If excludedStatuses are supplied, use that. Otherwise, use statuses.
            if (excludedStatuses?.length) {
                // Move item only if its status _is not_ in the excluded statuses list.
                return !excludedStatuses.includes(item.fields.status);
            } else {
                // Move item only if its status _is_ in the statuses list.
                return statuses.includes(item.fields.status);
            }
        });
        // Collect details for filtered issues like assignee, associated pull request etc.
        core.setOutput("Result", filteredItems)
    } catch (error) {
        core.setFailed(error.message);
        console.log(error.message)
    }
};

run();