exports.handler = async (event) => {
    const token = 'allow';
    switch (token) {
        case 'allow':
            return generateAuthResponse('user', 'Allow', '*');
        case 'deny':
            return generateAuthResponse('user', 'Deny', '*');
        default:
            return Promise.reject('Error: Invalid token');
    }
};

function generateAuthResponse(principalId, effect, resource) {
    const policyDocument = generatePolicyDocument(effect, resource);
    return {
        principalId,
        policyDocument
    };
}

function generatePolicyDocument(effect, resource) {
    return {
        Version: '2012-10-17',
        Statement: [{
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource
        }]
    };
}