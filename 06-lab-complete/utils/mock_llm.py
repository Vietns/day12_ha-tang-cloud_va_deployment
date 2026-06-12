import random
import time


MOCK_RESPONSES = {
    "default": [
        "This is a mock AI agent response. In production this would call a real LLM provider.",
        "The agent is running correctly. Your question was received and processed.",
        "Cloud deployment is working. This response came from the production lab agent.",
    ],
    "docker": [
        "Docker packages an application and its dependencies into a container so it can run consistently across environments."
    ],
    "deploy": [
        "Deployment is the process of moving an application from local development to a server or cloud platform."
    ],
    "health": [
        "The agent is healthy and ready to serve requests."
    ],
}


def ask(question: str, delay: float = 0.1) -> str:
    time.sleep(delay + random.uniform(0, 0.05))

    question_lower = question.lower()
    for keyword, responses in MOCK_RESPONSES.items():
        if keyword in question_lower:
            return random.choice(responses)

    return random.choice(MOCK_RESPONSES["default"])
