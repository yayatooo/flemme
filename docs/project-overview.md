# Flemme

## Overview

Flemme is a personal AI cooking companion that helps users decide what to cook
from ingredients they already have and guides them through the cooking process
step by step.

Flemme considers available ingredients, kitchen conditions, taste preferences,
food restrictions, and household context before recommending meals.

## Goals

1. Reduce decision fatigue before cooking.
2. Recommend meals that make good use of ingredients already available.
3. Personalize recommendations using kitchen, taste, and household context.
4. Guide users through cooking one meaningful step at a time.
5. Build a reusable cooking context that improves future recommendations.

## Core User Flow

1. User starts a cooking session.
2. User provides available ingredients.
3. Ingredients are confirmed.
4. Flemme applies kitchen, taste, and household context.
5. Flemme generates recipe recommendations.
6. User selects a recipe.
7. User reviews recipe details.
8. User starts cooking.
9. Flemme guides the user step by step.
10. Cooking is completed.
11. Recipe may be stored in favorite/history.

## Core MVP Features

- Ingredient input
- Ingredient confirmation
- Kitchen profile
- Taste profile
- Household profile
- Recipe recommendations
- Recipe detail
- Nutrition estimate
- Household adjustment
- Interactive cooking session
- Cooking completion
- Favorites
- Basic cooking history

## Important Secondary Module

- Budgeting

Budgeting is complementary and must not become a dependency of the primary
cooking flow.

## Out of Scope for Core MVP

- Full fridge inventory
- Diet program
- Meal planning
- Subscription
- Payment
- Advanced analytics
- Full expense accounting

### Account Credit

- Every newly registered account starts with **5 credit points**.
- Credit belongs to the account.
- The initial 5 credits are granted automatically after successful account creation.
- Credit usage rules will be defined separately before implementation.

For the MVP, the system must not assume how many credits are consumed by a
specific AI action until the credit consumption rules are explicitly defined.

## Success Criteria

The MVP is successful when a user can:

1. Provide ingredients.
2. Confirm the ingredient list.
3. Receive relevant recipe recommendations.
4. Understand why each recipe was recommended.
5. Choose a recipe.
6. See estimated nutrition.
7. Follow step-by-step cooking guidance.
8. Finish cooking.
9. Save the result to favorite/history.
