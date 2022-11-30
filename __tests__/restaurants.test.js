const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const app = require('../lib/app');
const request = require('supertest');
const UserService = require('../lib/services/UserService');
// const authorizeDelete = require('../lib/models/authorizeDelete');

const mockMe = {
  firstName: 'Madison',
  lastName: 'Czarapata',
  email: 'madison@test.com',
  password: '654321',
};

const registerAndLogin = async () => {
  const agent = request.agent(app);
  const user = await UserService.create(mockMe);
  await agent
    .post('/api/v1/users/sessions')
    .send({ email: mockMe.email, password: mockMe.password });
  return [agent, user];
};

describe('restaurant routes', () => {
  beforeEach(() => {
    return setup(pool);
  });
  afterAll(() => {
    pool.end();
  });

  it('GET api/v1/restaurants should return a list of all restaurants', async () => {
    const resp = await request(app).get('/api/v1/restaurants');
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchInlineSnapshot(`
      Array [
        Object {
          "cost": 1,
          "cuisine": "American",
          "id": "1",
          "image": "https://media-cdn.tripadvisor.com/media/photo-o/05/dd/53/67/an-assortment-of-donuts.jpg",
          "name": "Pip's Original",
          "website": "http://www.PipsOriginal.com",
        },
        Object {
          "cost": 3,
          "cuisine": "Italian",
          "id": "2",
          "image": "https://media-cdn.tripadvisor.com/media/photo-m/1280/13/af/df/89/duck.jpg",
          "name": "Mucca Osteria",
          "website": "http://www.muccaosteria.com",
        },
        Object {
          "cost": 2,
          "cuisine": "Mediterranean",
          "id": "3",
          "image": "https://media-cdn.tripadvisor.com/media/photo-m/1280/1c/f2/e5/0c/dinner.jpg",
          "name": "Mediterranean Exploration Company",
          "website": "http://www.mediterraneanexplorationcompany.com/",
        },
        Object {
          "cost": 2,
          "cuisine": "American",
          "id": "4",
          "image": "https://media-cdn.tripadvisor.com/media/photo-o/0d/d6/a1/06/chocolate-gooey-brownie.jpg",
          "name": "Salt & Straw",
          "website": "https://saltandstraw.com/pages/nw-23",
        },
      ]
    `);
  });

  it('GET api/v1/restaurants/rest:id should a restaurant with reviews attached', async () => {
    const resp = await request(app).get('/api/v1/restaurants/1');
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchInlineSnapshot(`
      Object {
        "cost": 1,
        "cuisine": "American",
        "id": "1",
        "image": "https://media-cdn.tripadvisor.com/media/photo-o/05/dd/53/67/an-assortment-of-donuts.jpg",
        "name": "Pip's Original",
        "reviews": Array [
          Object {
            "detail": "Best restaurant ever!",
            "id": "1",
            "restaurantId": "1",
            "stars": 5,
            "userId": "1",
          },
          Object {
            "detail": "Terrible service :(",
            "id": "2",
            "restaurantId": "1",
            "stars": 1,
            "userId": "2",
          },
          Object {
            "detail": "It was fine.",
            "id": "3",
            "restaurantId": "1",
            "stars": 4,
            "userId": "3",
          },
        ],
        "website": "http://www.PipsOriginal.com",
      }
    `);
  });

  it('POST /api/v1/restaurants/:id/reviews will not create a new review with no logged in user', async () => {
    const agent = await request.agent(app);
    const resp = await agent
      .post('/api/v1/restaurants/1/reviews')
      .send({ stars: '5', detail: 'New review' });
    expect(resp.status).toBe(401);
  });

  it('POST /api/v1/restaurants/:restId/reviews should create a new review when user is logged in', async () => {
    const [agent] = await registerAndLogin();
    const resp = await agent
      .post('/api/v1/restaurants/1/reviews')
      .send({ stars: 4, detail: 'Here is the comment you ordered' });
    expect(resp.status).toBe(200);
    expect(resp.body).toMatchInlineSnapshot(`
      Object {
        "detail": "Here is the comment you ordered",
        "id": "4",
        "restaurantId": "1",
        "stars": 4,
        "userId": "4",
      }
    `);
  });

  it('DELETE /api/v1/reviews/:id owner of review can delete review', async () => {
    const [agent] = await registerAndLogin();
    await agent
      .post('/api/v1/restaurants/1/reviews')
      .send({ stars: '4', detail: 'Latest Review' });
    const resp = await agent.delete('/api/v1/reviews/4');
    console.log('message', resp.body.message);
    expect(resp.status).toBe(200);
    const revResp = await agent.get('/api/v1/reviews/4');
    expect(revResp.status).toBe(404);
  });

  it('DELETE /api/v1/reviews/:id unauthorized users can not delete', async () => {
    const [agent] = await registerAndLogin();
    await agent
      .post('/api/v1/restaurants/1/reviews')
      .send({ stars: '5', detail: 'New review' });
    const resp = await agent.delete('/api/v1/reviews/1');
    expect(resp.status).toBe(403);
  });

  it('DELETE /api/v1/reviews/:id admin can delete the review', async () => {
    const agent = request.agent(app);
    await UserService.create({
      firstName: 'Hunter',
      lastName: 'Czarapata',
      email: 'admin',
      password: '654321',
    });
    await agent
      .post('/api/v1/users/sessions')
      .send({ email: 'admin', password: '654321' });
    const resp = await agent.delete('/api/v1/reviews/1');
    expect(resp.status).toBe(200);
    const reviewResp = await agent.get('/api/v1/reviews/1');
    expect(reviewResp.status).toBe(404);
  });
});
