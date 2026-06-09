class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    async create(data) {
        return await this.model.create(data);
    }

    async findById(id, select = null) {
        let query = this.model.findById(id);
        if (select) query = query.select(select);
        return await query;
    }

    async findOne(filter, select = null) {
        let query = this.model.findOne(filter);
        if (select) query = query.select(select);
        return await query;
    }

    async findAll(filter = {}, options = {}) {
        const { page = 1, limit = 10, sort = '-createdAt', select } = options;
        const skip = (page - 1) * limit;

        let query = this.model.find(filter);
        if (select) query = query.select(select);
        query = query.sort(sort).skip(skip).limit(limit);

        const [data, total] = await Promise.all([
            query,
            this.model.countDocuments(filter)
        ]);

        return {
            data,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async update(id, data) {
        return await this.model.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true
        });
    }

    async updateOne(filter, data) {
        return await this.model.findOneAndUpdate(filter, data, {
            new: true,
            runValidators: true
        });
    }

    async delete(id) {
        return await this.model.findByIdAndDelete(id);
    }

    async exists(filter) {
        return await this.model.exists(filter);
    }

    async aggregate(pipeline) {
        return await this.model.aggregate(pipeline);
    }
}

module.exports = BaseRepository;