/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        /* RULES */
        {
            name: 'no-circular',
            severity: 'error',
            comment: 'Circular dependencies break strict layering and cause runtime issues.',
            from: {},
            to: {
                circular: true
            }
        },
        {
            name: 'no-orphans',
            severity: 'warn',
            from: {
                orphan: true,
                pathNot: ['^tests/'] // Ignore tests being orphans
            },
            to: {}
        },
        {
            name: 'lib-cannot-import-api',
            severity: 'error',
            comment: 'Core libraries (Domain/Utils) should NEVER depend on API/Controllers.',
            from: {
                path: '^lib/'
            },
            to: {
                path: '^api/'
            }
        },
        {
            name: 'no-import-scripts',
            severity: 'error',
            comment: 'Application code should not import from standalone scripts.',
            from: {
                path: '^api/|^lib/'
            },
            to: {
                path: '^scripts/'
            }
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules'
        },
        tsPreCompilationDeps: true,
        tsConfig: {
            fileName: './tsconfig.json'
        },
        enhancedResolveOptions: {
            exportsFields: ['exports'],
            conditionNames: ['import', 'require', 'node', 'default']
        },
        reporterOptions: {
            dot: {
                collapsePattern: 'node_modules/[^/]+'
            }
        }
    }
};
