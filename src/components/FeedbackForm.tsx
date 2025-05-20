import React, { useState } from 'react';

export type Feedback = {
  routeId: number;
  rating: number;
  comment: string;
};

type FeedbackFormProps = {
  routeId: number;
  onSubmit: (feedback: Feedback) => Promise<void>;
};

const FeedbackForm: React.FC<FeedbackFormProps> = ({ routeId, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      await onSubmit({ routeId, rating, comment });
      setSuccess(true);
      setRating(0);
      setComment('');
    } catch (err) {
      setError('送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium mb-1">評価</label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={
                'text-2xl ' + (rating >= star ? 'text-yellow-400' : 'text-gray-300')
              }
              onClick={() => setRating(star)}
              disabled={isSubmitting}
            >
              ★
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">コメント</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={comment}
          onChange={e => setComment(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">送信が完了しました！</div>}
      <button
        type="submit"
        className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
        disabled={isSubmitting || rating === 0}
      >
        {isSubmitting ? '送信中...' : 'フィードバック送信'}
      </button>
    </form>
  );
};

export default FeedbackForm; 